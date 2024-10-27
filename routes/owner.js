const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Owner = require('../models/ownerModel');
const Institute = require('../models/instituteModel');
const upload = require('../config/multer-config'); // Assuming you have a multer config
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const authMiddleware = require('../middlewares/auth');

// Create Owner (allow only one owner)
router.post('/create-owner', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if an owner already exists
        const existingOwner = await Owner.findOne();
        if (existingOwner) {
            return res.status(403).json({ error: 'An owner already exists.' });
        }

        // Hash the password and save the owner
        const hashedPassword = await bcrypt.hash(password, 10);
        const newOwner = new Owner({
            name,
            email,
            password: hashedPassword,
            secCode: password
        });
        await newOwner.save();

        res.status(201).json({ message: 'Owner created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating owner: ' + error.message });
    }
});

router.get('/', function(req, res) {
    res.json('Hello, this is the owner dashboard');
});

// Create Institute
router.post('/create-institute', upload.fields([{ name: 'iso', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
    const { ownerName, password, email, uniqueId, instituteName, shortName } = req.body;
    
    try {
        const existingInstitute = await Institute.findOne({ $or: [{ email }, { uniqueId }] });
        if (existingInstitute) {
            return res.status(400).json({ error: 'Institute with this email or unique ID already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newInstitute = new Institute({
            ownerName,
            instituteName,
            shortName,
            password: hashedPassword,
            email,
            uniqueId,
            iso: req.files.iso ? req.files.iso[0].publicUrl : "",  
            logo: req.files.logo ? req.files.logo[0].publicUrl : "", 
            secCode: password
        });
        
        await newInstitute.save();

        res.status(201).json({ message: 'Institute created successfully', newInstitute });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login Route (for both Owner and Institute)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    let user = await Owner.findOne({ email });
    let role = 'owner';

    if (!user) {
        user = await Institute.findOne({ email });
        role = 'institute';
    }

    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
        { id: user._id, email: user.email, role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
});

// Logout
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

// Get all institutes (Only for Owner)
router.get('/institutes', authMiddleware, async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can view all institutes.' });
    }

    try {
        const institutes = await Institute.find();
        res.status(200).json(institutes);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Updating Institute Data
router.post('/:instituteId/edit', upload.fields([{ name: 'iso', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
    const { instituteId } = req.params;
    const { ownerName, email, uniqueId, instituteName, shortName } = req.body;

    try {
        let institute = await Institute.findById(instituteId);
        if (!institute) {
            return res.status(404).json({ error: 'Institute not found' });
        }

        const existingInstitute = await Institute.findOne({
            $or: [{ email }, { uniqueId }],
            _id: { $ne: instituteId }
        });

        if (existingInstitute) {
            return res.status(400).json({ error: 'Email or unique ID is already in use by another institute.' });
        }

        institute.ownerName = ownerName || institute.ownerName;
        institute.instituteName = instituteName || institute.instituteName;
        institute.shortName = shortName || institute.shortName;
        institute.email = email || institute.email;
        institute.uniqueId = uniqueId || institute.uniqueId;

        if (req.files.iso) {
            institute.iso = req.files.iso[0].publicUrl;
        }

        if (req.files.logo) {
            institute.logo = req.files.logo[0].publicUrl;
        }

        await institute.save();

        res.status(200).json({ message: 'Institute details updated successfully', institute });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Delete Institute and Associated Data
router.post('/delete/:instituteId', async (req, res) => {
    const { instituteId } = req.params;

    try {
        const deletedInstitute = await Institute.findByIdAndDelete(instituteId);

        if (!deletedInstitute) {
            return res.status(404).json({ error: 'Institute not found' });
        }

        await Student.deleteMany({ institute: instituteId });
        await Exam.deleteMany({ institute: instituteId });

        res.status(200).json({ message: 'Institute and associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;
