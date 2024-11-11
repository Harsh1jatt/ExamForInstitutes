const jwt = require('jsonwebtoken');
const Owner = require('../models/ownerModel');
const Institute = require('../models/instituteModel');
const Student = require('../models/studentModel');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, role } = decoded; // Extract id and role from the token

        // Check the role and fetch the corresponding model
        if (role === 'owner') {
            const owner = await Owner.findById(id);
            if (!owner) {
                return res.status(404).json({ error: 'Owner not found' });
            }
            req.owner = owner;
            req.userType = 'owner';
        } else if (role === 'institute') {
            const institute = await Institute.findById(id);
            if (!institute) {
                return res.status(404).json({ error: 'Institute not found' });
            }
            req.institute = institute;
            req.userType = 'institute';
        } else if (role === 'student') {
            const student = await Student.findById(id);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            req.student = student;
            req.userType = 'student';
        } else {
            return res.status(400).json({ error: 'Invalid role in token' });
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
