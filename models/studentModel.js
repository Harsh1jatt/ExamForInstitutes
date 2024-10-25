const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    studentName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    institute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'institute',
        required: true
    },
    rollNumber: {
        type: String
    },
    examsTaken: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exam'
    }],
    dateOfBirth: {
        type: String
    },
    profileImage: {
        type: String
    },
    secCode:{
        type: String,
        required: true
    },
    score: {
        type: String,
    },
    passed: {
        type: Boolean,
    }
});

const Student = mongoose.model('student', studentSchema);
module.exports = Student;
