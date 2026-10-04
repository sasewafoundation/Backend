const Volunteer = require('../models/Volunteer');
const path = require('path');
const fs = require('fs/promises');

// @desc    Get all volunteers
// @route   GET /api/volunteers
// @access  Private
exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find().sort('-createdAt');
        res.status(200).json({ success: true, count: volunteers.length, data: volunteers });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Apply as volunteer or intern
// @route   POST /api/volunteers
// @access  Public
// FIX 10: Robust validation for name, email, phone (with clean digit check), and skills
exports.applyToVolunteer = async (req, res) => {
    try {
        const { name, email, phone, skills, applicationType, availability, message } = req.body;

        if (!name || !email || !phone || !skills) {
            return res.status(400).json({ success: false, message: 'Name, email, phone number, and skills are required.' });
        }

        // FIX 10: Validate phone format (minimum 7 digits after stripping whitespace and punctuation)
        const cleanPhone = String(phone).replace(/[\s\-\(\)\+]/g, '');
        if (cleanPhone.length < 7) {
            return res.status(400).json({ success: false, message: 'Please provide a valid phone number (at least 7 digits).' });
        }

        const volunteerPayload = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            skills: skills.trim(),
            applicationType: applicationType === 'Internship' ? 'Internship' : 'Volunteer',
            availability: availability || 'Hybrid',
            message: message ? message.trim() : '',
        };

        if (req.file) {
            volunteerPayload.cvFile = `/uploads/${req.file.filename}`;
            volunteerPayload.cvOriginalName = req.file.originalname;
        }

        const volunteer = await Volunteer.create(volunteerPayload);
        res.status(201).json({ success: true, data: volunteer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Unable to submit volunteer application' });
    }
};

// @desc    Update volunteer application status
// @route   PUT /api/volunteers/:id
// @access  Private
exports.updateVolunteerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const volunteer = await Volunteer.findByIdAndUpdate(
            req.params.id, 
            { status: status.toLowerCase() }, 
            { new: true, runValidators: true }
        );

        if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer not found' });
        res.status(200).json({ success: true, data: volunteer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete volunteer application
// @route   DELETE /api/volunteers/:id
// @access  Private
// FIX 11: Safely delete CV file from local uploads directory when deleting volunteer record
exports.deleteVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        // FIX 11: Remove CV file from disk if present
        const cvPath = volunteer.cvFile || volunteer.cv;
        if (cvPath) {
            try {
                // Remove leading slash if any
                const normalizedRelPath = cvPath.startsWith('/')
                    ? cvPath.slice(1)
                    : cvPath;
                const absoluteCvPath = path.join(__dirname, '..', normalizedRelPath);
                await fs.unlink(absoluteCvPath);
            } catch (fileErr) {
                console.warn('Warning: Could not delete CV file from disk:', fileErr.message);
            }
        }

        await Volunteer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
