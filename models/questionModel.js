const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the question schema
const questionSchema = new Schema({
    questionText: {
        type: String,
        required: true
    },
    options: {
        type: [String], 
        required: true
    },
    correctAnswer: {
        type: String,
        required: true
    },
    subfield: {
        type: String, 
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exam',
        required: true
    }
});

// Create the Question model
const Question = mongoose.model('question', questionSchema);

module.exports = Question;
