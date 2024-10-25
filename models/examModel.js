const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const examSchema = new Schema({
    examName: {
        type: String,
        required: true
    },
    examDescription: {
        type: String
    },
    institute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'institute', 
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'question',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'institute',
        required: true
    },
    studentsAttempted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student'
    }],
    dateCreated: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number // Duration in minutes
    },
    maxMarks: {
        type: Number,
        required: true
    },
    passMarks: {
        type: Number,
        required: true
    }
});

// Create the Exam model
const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
