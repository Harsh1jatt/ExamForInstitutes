const mongoose = require('mongoose');

const TypingTestSchema = new mongoose.Schema({
    institute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        required: true,
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    passage: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        default: 60 // in seconds
    },
    totalWords: {
        type: Number,
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    results: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        wpm: Number,
        accuracy: Number,
        dateTaken: {
            type: Date,
            default: Date.now,
        },
    }],
});

const TypingTest = mongoose.model('TypingTest', TypingTestSchema);

module.exports = TypingTest;
