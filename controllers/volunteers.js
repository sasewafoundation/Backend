const Volunteer = require('../models/Volunteer');

exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find().sort('-createdAt');
        res.status(200).json({ success: true, count: volunteers.length, data: volunteers });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.applyToVolunteer = async (req, res) => {
    try {
        const { name, email, phone, skills, applicationType, availability, message } = req.body;

        if (!name || !email || !phone || !skills) {
            return res.status(400).json({ success: false, message: 'Name, email, phone and skills are required' });
        }

        const volunteerPayload = {
            name,
            email,
            phone,
            skills,
            applicationType: applicationType === 'Internship' ? 'Internship' : 'Volunteer',
            availability: availability || 'Hybrid',
            message: message || '',
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

exports.updateVolunteerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
        if (!volunteer) return res.status(404).json({ success: false, message: 'Volunteer not found' });
        res.status(200).json({ success: true, data: volunteer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: 'Volunteer not found' });
        }

        await Volunteer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
