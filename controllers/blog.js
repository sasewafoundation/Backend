const BlogPost = require('../models/BlogPost');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

exports.getBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find().sort('-createdAt');
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getBlogPostBySlug = async (req, res) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug });
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found via current slug.' });
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.createBlogPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Blog title and content are required' });
        }

        let image = '';
        let imagePublicId = '';
        let images = [];
        let imagePublicIds = [];
        const published = req.body.published !== 'false';
        
        // Single 'image' or first from array
        if (req.file) {
            const uploaded = await uploadImageBuffer(req.file, 'sa-sewa/blog');
            image = uploaded.secure_url;
            imagePublicId = uploaded.public_id;
        } else if (req.files && req.files.image) {
            const uploaded = await uploadImageBuffer(req.files.image[0], 'sa-sewa/blog');
            image = uploaded.secure_url;
            imagePublicId = uploaded.public_id;
        }
        
        // Gallary 'images'
        if (req.files && req.files.images) {
            const uploadedGallery = await Promise.all(req.files.images.map((file) => uploadImageBuffer(file, 'sa-sewa/blog')));
            images = uploadedGallery.map((item) => item.secure_url);
            imagePublicIds = uploadedGallery.map((item) => item.public_id);
        }

        const post = await BlogPost.create({ ...req.body, image, imagePublicId, images, imagePublicIds, published });
        res.status(201).json({ success: true, data: post });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A blog post with a similar slug already exists. Please try a slightly different title.' });
        }
        return res.status(500).json({ success: false, message: err.message || 'Failed to create blog post' });
    }
};

exports.updateBlogPost = async (req, res) => {
    try {
        let post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });

        let image = post.image;
        let imagePublicId = post.imagePublicId;

        if (req.file) {
            const uploaded = await uploadImageBuffer(req.file, 'sa-sewa/blog');
            image = uploaded.secure_url;
            imagePublicId = uploaded.public_id;

            if (post.imagePublicId) {
                await destroyImage(post.imagePublicId);
            }
        }

        const published = req.body.published === undefined ? post.published : req.body.published !== 'false';

        post = await BlogPost.findByIdAndUpdate(req.params.id, { ...req.body, image, imagePublicId, published }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update blog post' });
    }
};

exports.deleteBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });

        if (post.imagePublicId) {
            await destroyImage(post.imagePublicId);
        }

        if (post.imagePublicIds && post.imagePublicIds.length > 0) {
            await Promise.all(post.imagePublicIds.map((publicId) => destroyImage(publicId)));
        }
        
        await BlogPost.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
