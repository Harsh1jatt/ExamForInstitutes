const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const instituteSchema = new Schema({
    ownerName: {
        type: String,
        required: true,
        trim: true, // Trims whitespace
    },
    instituteName: {
        type: String,
        required: true,
        trim: true,
    },
    shortName: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure unique emails
        lowercase: true, // Normalize to lowercase
        match: [/.+\@.+\..+/, 'Please enter a valid email address'], // Basic email validation
    },
    phone: {
        type: String,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'], // Ensure valid phone number format
    },
    iso: {
        type: String,
        required: true,
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student', // Ensure correct reference casing
        default: [], // Default to empty array
    }],
    exams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student', // Ensure correct reference casing
        default: [], // Default to empty array
    }],
    uniqueId: {
        type: String,
        required: true,
        unique: true, // Ensure unique ID for the institute
    },
    secCode: {
        type: String,
    }
}, { timestamps: true });

const Institute = mongoose.model('Institute', instituteSchema);
module.exports = Institute;
