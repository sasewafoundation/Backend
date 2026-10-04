const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    // FIX 15: Default to false (draft) requiring explicit publication
    published: { type: Boolean, default: false },
    image: { type: String }, // Primary Header Image
    imagePublicId: { type: String },
    images: [{ type: String }], // Additional Field Photos
    imagePublicIds: [{ type: String }],
    youtubeLink: { type: String },
}, { timestamps: true });

// Pre-save middleware to create slug from title
blogPostSchema.pre('save', function() {
    if (!this.isModified('title')) return;

    const baseSlug = this.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();

    this.slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
