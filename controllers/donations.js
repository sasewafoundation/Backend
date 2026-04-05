const Donation = require('../models/Donation');

exports.getDonations = async (req, res) => {
    try {
        const donations = await Donation.find().sort('-createdAt');
        res.status(200).json({ success: true, count: donations.length, data: donations });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.addDonationInquiry = async (req, res) => {
    try {
        const donation = await Donation.create(req.body);
        res.status(201).json({ success: true, data: donation });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteDonation = async (req, res) => {
    try {
        await Donation.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
