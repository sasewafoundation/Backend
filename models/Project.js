const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    projectType: { type: String, default: '' },
    slug: { type: String, unique: true, sparse: true }, // Sparse allows existing nulls to pass
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    status: { type: String, enum: ['Active', 'Completed', 'Upcoming'], default: 'Active' },
    location: { type: String }, // Geo-localization
    youtubeLink: { type: String }, // Field footage
}, { timestamps: true });

// Pre-save slug generation
projectSchema.pre('save', function() {
    if (!this.isModified('title')) return;
    const baseSlug = this.title.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();
    this.slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
});

module.exports = mongoose.model('Project', projectSchema);
