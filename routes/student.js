
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Student = require('../models/studentModel');
const Exam = require('../models/examModel');
const  JWT_EXPIRATION = '3h'; // Ensure to set these in your environment variables

// Middleware to protect routes using JWT
const isAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Token not provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.student = decoded; // Attach decoded data to the request
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Student login
router.post('/login', async (req, res) => {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
        return res.status(400).json({ error: 'Roll number and password are required' });
    }

    try {
        const student = await Student.findOne({ rollNumber }).populate('institute');
        if (!student) {
            return res.status(400).json({ error: 'Invalid roll number or password' });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid roll number or password' });
        }

        const token = jwt.sign(
            {
                id: student._id,
                rollNumber: student.rollNumber,
                name: student.studentName,
                institute: student.institute,
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            student: {
                id: student._id,
                name: student.studentName,
                rollNumber: student.rollNumber,
                institute: student.institute,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});


// Student logout (JWT logout is handled client-side by removing the token)
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful. Please remove the token on the client side.' });
});

// Fetch student profile with institute details
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).populate('institute');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.status(200).json({
            message: 'Profile accessed successfully',
            student,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Fetching all exams for the logged-in student's institute
router.get('/exams', isAuthenticated, async (req, res) => {
    try {
        const exams = await Exam.find({ institute: req.student.institute._id });
        res.status(200).json({
            exams,
            message: 'Exams fetched successfully!',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetching questions for a specific exam
router.get('/exams/:id', isAuthenticated, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');

        if (!exam || exam.questions.length === 0) {
            return res.status(404).json({ error: 'No questions found for this exam' });
        }

        res.status(200).json({
            exam,
            message: 'Exam fetched successfully!',
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Exam attempt history
router.get('/exams/history', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).populate('examsTaken');
        res.status(200).json(student.examsTaken);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submitting an exam
router.post('/exams/:id/submit', isAuthenticated, async (req, res) => {
    const { studentAnswers } = req.body;
    const examId = req.params.id;

    try {
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ error: "Exam not found" });
        }

        const student = await Student.findById(req.student.id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        if (student.examsTaken.includes(examId)) {
            return res.status(400).json({ error: "You have already attempted this exam." });
        }

        let score = 0;
        let correctAnswers = 0;

        exam.questions.forEach((question, index) => {
            const studentAnswer = studentAnswers[index];
            const correctAnswer = question.correctAnswer;

            if (studentAnswer === correctAnswer) {
                correctAnswers++;
            }
        });

        score = (correctAnswers / exam.questions.length) * exam.maxMarks;
        const passed = score >= exam.passMarks;

        student.examsTaken.push(examId);
        student.score = score.toString();
        student.passed = passed;

        await student.save();

        exam.studentsAttempted.push(req.student.id);
        await exam.save();

        res.status(200).json({
            message: 'Exam submitted successfully!',
            score,
            passed,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
