const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Owner = require('../models/ownerModel');
const Institute = require('../models/instituteModel');
const upload = require('../config/multer-config'); // Assuming you have a multer config
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const authMiddleware = require('../middlewares/auth')

// Create Owner (only in development mode)
if (process.env.MODE === 'development') {
    router.post('/create-owner', async (req, res) => {
        const { name, email, password } = req.body;
        let pass = password;
        const existingOwner = await Owner.findOne({ email });
        if (existingOwner) {
            return res.status(400).json({ error: 'Owner with this email already exists.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newOwner = new Owner({
                name,
                email,
                password: hashedPassword,
                secCode: pass
            });
            await newOwner.save();

            res.status(201).json({ message: 'Owner created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error creating owner: ' + error.message });
        }
    });
}

router.get('/', function(req, res){
    res.json('Hello this is owner dashboard')
})
// Create Institute
router.post('/create-institute', upload.fields([{ name: 'iso', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
    const { ownerName, password, email, uniqueId, instituteName, shortName } = req.body;
    
    try {
        // Check if the institute already exists by email or unique ID
        const existingInstitute = await Institute.findOne({ $or: [{ email }, { uniqueId }] });
        if (existingInstitute) {
            return res.status(400).json({ error: 'Institute with this email or unique ID already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new institute with file URLs for iso and logo
        const newInstitute = new Institute({
            ownerName,
            instituteName,
            shortName,
            password: hashedPassword,
            email,
            uniqueId,
            iso: req.files.iso ? req.files.iso[0].publicUrl : "",  // Retrieve ISO URL
            logo: req.files.logo ? req.files.logo[0].publicUrl : "", // Retrieve logo URL
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

    // First check if it's an Owner
    let user = await Owner.findOne({ email });
    let role = 'owner';

    if (!user) {
        // If not Owner, check if it's an Institute
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

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, email: user.email, role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
});

// Logout (handled client-side by removing token)
router.post('/logout', (req, res) => {
    // Client-side should handle clearing the JWT token
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
        // Find the existing institute by ID
        let institute = await Institute.findById(instituteId);
        if (!institute) {
            return res.status(404).json({ error: 'Institute not found' });
        }

        // Check if email or uniqueId are already in use by another institute
        const existingInstitute = await Institute.findOne({
            $or: [{ email }, { uniqueId }],
            _id: { $ne: instituteId } // Exclude current institute
        });

        if (existingInstitute) {
            return res.status(400).json({ error: 'Email or unique ID is already in use by another institute.' });
        }

        // Update institute details
        institute.ownerName = ownerName || institute.ownerName;
        institute.instituteName = instituteName || institute.instituteName;
        institute.shortName = shortName || institute.shortName;
        institute.email = email || institute.email;
        institute.uniqueId = uniqueId || institute.uniqueId;

        // Update ISO image if provided
        if (req.files.iso) {
            institute.iso = req.files.iso[0].publicUrl;
        }

        // Update logo image if provided
        if (req.files.logo) {
            institute.logo = req.files.logo[0].publicUrl;
        }

        // Save updated institute
        await institute.save();

        res.status(200).json({ message: 'Institute details updated successfully', institute });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Delete

router.post('/delete/:instituteId', async (req, res) => {
    const { instituteId } = req.params;

    try {
        // Find and delete the institute
        const deletedInstitute = await Institute.findByIdAndDelete(instituteId);

        // Check if the institute was found and deleted
        if (!deletedInstitute) {
            return res.status(404).json({ error: 'Institute not found' });
        }

        // Optionally, delete associated students and exams if they are referenced
        await Student.deleteMany({ institute: instituteId });
        await Exam.deleteMany({ institute: instituteId });

        res.status(200).json({ message: 'Institute and associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});


module.exports = router;
