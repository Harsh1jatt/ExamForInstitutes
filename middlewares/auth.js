const jwt = require('jsonwebtoken');
const Owner = require('../models/ownerModel');
const Institute = require('../models/instituteModel');
const Student = require('../models/studentModel');

// Middleware to differentiate between user types
const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token);  // Log token for debugging

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);  // Log decoded token for debugging

        if (decoded.ownerId) {
            const owner = await Owner.findById(decoded.ownerId);
            if (!owner) {
                return res.status(404).json({ error: 'Owner not found' });
            }
            req.owner = owner;
            req.userType = 'owner';
        } else if (decoded.instituteId) {
            const institute = await Institute.findById(decoded.instituteId);
            if (!institute) {
                return res.status(404).json({ error: 'Institute not found' });
            }
            req.institute = institute;
            req.userType = 'institute';
        } else if (decoded.studentId) {
            const student = await Student.findById(decoded.studentId);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            req.student = student;
            req.userType = 'student';
        }

        next();
    } catch (error) {
        console.error('JWT Error:', error);  // Log JWT error
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};


module.exports = authMiddleware;
