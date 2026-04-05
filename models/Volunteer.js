const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    skills: { type: String, required: true },
    applicationType: { type: String, enum: ['Volunteer', 'Internship'], default: 'Volunteer' },
    availability: { type: String, enum: ['Remote', 'On-Site', 'Hybrid'], default: 'Hybrid' },
    message: { type: String, trim: true, default: '' },
    cvFile: { type: String, default: '' },
    cvOriginalName: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
