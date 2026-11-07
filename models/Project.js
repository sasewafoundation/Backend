const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    summary: { type: String, default: '', trim: true },
    projectType: { type: String, default: '' },
    slug: { type: String, unique: true, sparse: true, trim: true },
    startDate: { type: Date, default: null },
    images: [{ type: String }],
    imagePublicIds: [{ type: String }],
    status: { type: String, enum: ['Active', 'Completed', 'Upcoming'], default: 'Active' },
    location: { type: String },
    youtubeLink: { type: String },
    mapSettings: {
        mapEnabled: { type: Boolean, default: false },
        regionName: { type: String, default: '', trim: true },
        regionGeoJSON: { type: mongoose.Schema.Types.Mixed, default: null },
    },
}, { timestamps: true });

// Pre-save slug generation if not explicitly provided
projectSchema.pre('save', function() {
    if (!this.slug && this.title) {
        const baseSlug = this.title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
            .trim();
        this.slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }
});

module.exports = mongoose.model('Project', projectSchema);
