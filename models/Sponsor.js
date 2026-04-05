const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String },
    logoPublicId: { type: String },
    websiteUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Sponsor', sponsorSchema);
