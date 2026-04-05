const Sponsor = require('../models/Sponsor');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

exports.getSponsors = async (req, res) => {
    try {
        const sponsors = await Sponsor.find().sort('-createdAt');
        res.status(200).json({ success: true, count: sponsors.length, data: sponsors });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getSponsor = async (req, res) => {
    try {
        const sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found' });
        res.status(200).json({ success: true, data: sponsor });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.createSponsor = async (req, res) => {
    try {
        let logo = '';
        let logoPublicId = '';

        if (req.file) {
            const uploaded = await uploadImageBuffer(req.file, 'sa-sewa/sponsors');
            logo = uploaded.secure_url;
            logoPublicId = uploaded.public_id;
        }
        
        const sponsor = await Sponsor.create({ ...req.body, logo, logoPublicId });
        res.status(201).json({ success: true, data: sponsor });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.updateSponsor = async (req, res) => {
    try {
        let sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found' });

        let logo = sponsor.logo;
        let logoPublicId = sponsor.logoPublicId;

        if (req.file) {
            const uploaded = await uploadImageBuffer(req.file, 'sa-sewa/sponsors');
            logo = uploaded.secure_url;
            logoPublicId = uploaded.public_id;

            if (sponsor.logoPublicId) {
                await destroyImage(sponsor.logoPublicId);
            }
        }

        sponsor = await Sponsor.findByIdAndUpdate(req.params.id, { ...req.body, logo, logoPublicId }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: sponsor });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteSponsor = async (req, res) => {
    try {
        const sponsor = await Sponsor.findById(req.params.id);
        if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found' });

        if (sponsor.logoPublicId) {
            await destroyImage(sponsor.logoPublicId);
        }
        
        await Sponsor.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
