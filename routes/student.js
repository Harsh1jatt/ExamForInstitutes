const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Student = require('../models/studentModel');
const Exam = require('../models/ExamModel');
const Question = require('../models/QuestionModel');

// Middleware to protect routes that require student authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.student) {
        return next();  // Continue if the student is authenticated
    } else {
        return res.status(401).json({ error: 'Unauthorized: Please log in to access this route.' });
    }
};

// Student login
router.post('/login', async (req, res) => {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
        return res.status(400).json({ error: 'Roll number and password are required' });
    }

    try {
        // Find the student by roll number
        const student = await Student.findOne({ rollNumber });

        if (!student) {
            return res.status(400).json({ error: 'Invalid roll number or password' });
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid roll number or password' });
        }

        // Password is correct, log in the student by saving their info in the session
        req.session.student = {
            id: student._id,
            name: student.studentName,
            rollNumber: student.rollNumber,
            institute: student.institute // Store institute reference
        };

        res.status(200).json({
            message: 'Login successful',
            student: req.session.student
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Student logout
router.post('/logout', (req, res) => {
    if (req.session.student) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: 'Could not log out, please try again' });
            }
            res.clearCookie('connect.sid');  // Clear the session cookie
            return res.status(200).json({ message: 'Logout successful' });
        });
    } else {
        return res.status(400).json({ error: 'No student is logged in' });
    }
});

// Protected route (example)
router.get('/profile', isAuthenticated, (req, res) => {
    res.status(200).json({
        message: 'Profile accessed successfully',
        student: req.session.student
    });
});

// Fetching all exams for the logged-in student's institute
router.get('/exams', isAuthenticated, async (req, res) => {
    try {
        // Fetch exams based on the student's institute
        const exams = await Exam.find({ institute: req.session.student.institute });
        res.status(200).json({
            exams,
            message: 'Exams fetched successfully!'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetching questions for a specific exam
router.get('/exams/:id', isAuthenticated, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');
        
        // Check if the exam has no questions
        if (!exam || exam.questions.length === 0) {
            return res.status(404).json({ error: 'No questions found for this exam' });
        }

        res.status(200).json({
            exam,
            message: 'Exam fetched successfully!'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Exam attempt history
router.get('/exams/history', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.session.student.id).populate('examsTaken');
        res.status(200).json(student.examsTaken);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submitting an exam
router.post('/exams/:id/submit', isAuthenticated, async (req, res) => {
    const { studentAnswers } = req.body; // Array of student's answers
    const examId = req.params.id;
    const studentId = req.session.student.id; // Use session to get student information

    try {
        // Find the exam
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            return res.status(404).json({ error: "Exam not found" });
        }

        // Find the student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Check if the student already attempted this exam
        if (student.examsTaken.includes(examId)) {
            return res.status(400).json({ error: "You have already attempted this exam." });
        }

        let score = 0;
        let correctAnswers = 0;

        // Calculate the score
        exam.questions.forEach((question, index) => {
            const studentAnswer = studentAnswers[index]; // Student's answer for this question
            const correctAnswer = question.correctAnswer;

            if (studentAnswer === correctAnswer) {
                correctAnswers++;
            }
        });

        // Calculate score based on correct answers
        score = (correctAnswers / exam.questions.length) * exam.maxMarks;

        // Determine if the student passed
        const passed = score >= exam.passMarks;

        // Update the student's record
        student.examsTaken.push(examId);
        student.score = score.toString(); // Convert score to string (if necessary)
        student.passed = passed;

        // Save the updated student record
        await student.save();

        // Update the exam record (log that the student attempted the exam)
        exam.studentsAttempted.push(studentId);
        await exam.save();

        res.status(200).json({
            message: 'Exam submitted successfully!',
            score,
            passed
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
