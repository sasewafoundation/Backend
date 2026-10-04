const BlogPost = require('../models/BlogPost');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

// Helper to generate consistent slugs
const generateSlug = (title) => {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();
    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
};

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public (drafts hidden unless authenticated admin)
// FIX 15: Only return published posts for public visitors; show all for authenticated admins
exports.getBlogPosts = async (req, res) => {
    try {
        const filter = req.user ? {} : { published: true };
        const posts = await BlogPost.find(filter).sort('-createdAt');
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single blog post by ID
// @route   GET /api/blog/:id
// @access  Public
exports.getBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });
        
        // Hide unpublished drafts from non-admins
        if (!post.published && !req.user) {
            return res.status(404).json({ success: false, message: 'Blog post not found or not published' });
        }

        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single blog post by slug
// @route   GET /api/blog/s/:slug
// @access  Public
exports.getBlogPostBySlug = async (req, res) => {
    try {
        const filter = { slug: req.params.slug };
        if (!req.user) {
            filter.published = true;
        }

        const post = await BlogPost.findOne(filter);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found via current slug.' });
        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private
// FIX 15: Default published to false (draft) unless explicitly set to true
exports.createBlogPost = async (req, res) => {
    try {
        const { title, content, author, youtubeLink } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Blog title and content are required' });
        }

        let image = '';
        let imagePublicId = '';
        let images = [];
        let imagePublicIds = [];
        const published = req.body.published === true || req.body.published === 'true';

        // FIX 4: Handle single 'image' or 'images' array safely
        if (req.file) {
            const uploaded = await uploadImageBuffer(req.file, 'sa-sewa/blog');
            image = uploaded.secure_url;
            imagePublicId = uploaded.public_id;
        } else if (req.files && req.files.image && req.files.image.length > 0) {
            const uploaded = await uploadImageBuffer(req.files.image[0], 'sa-sewa/blog');
            image = uploaded.secure_url;
            imagePublicId = uploaded.public_id;
        }

        // Gallery 'images'
        if (req.files && req.files.images && req.files.images.length > 0) {
            const uploadedGallery = await Promise.all(
                req.files.images.map((file) => uploadImageBuffer(file, 'sa-sewa/blog'))
            );
            images = uploadedGallery.map((item) => item.secure_url);
            imagePublicIds = uploadedGallery.map((item) => item.public_id);
        }

        const post = await BlogPost.create({
            title,
            content,
            author: author || 'Admin',
            youtubeLink: youtubeLink || '',
            image,
            imagePublicId,
            images,
            imagePublicIds,
            published
        });

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A blog post with a similar title already exists.' });
        }
        return res.status(500).json({ success: false, message: err.message || 'Failed to create blog post' });
    }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private
// FIX 4 & FIX 14: Support cover + gallery uploads and regenerate slug when title updates
exports.updateBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });

        const { title, content, author, youtubeLink } = req.body;

        if (title && title !== post.title) {
            post.title = title;
            // FIX 14: Update slug when title changes
            post.slug = generateSlug(title);
        }

        if (content !== undefined) post.content = content;
        if (author !== undefined) post.author = author;
        if (youtubeLink !== undefined) post.youtubeLink = youtubeLink;
        if (req.body.published !== undefined) {
            post.published = req.body.published === true || req.body.published === 'true';
        }

        // FIX 4: Update cover image if provided
        let newCoverFile = null;
        if (req.file) {
            newCoverFile = req.file;
        } else if (req.files && req.files.image && req.files.image.length > 0) {
            newCoverFile = req.files.image[0];
        }

        if (newCoverFile) {
            const uploaded = await uploadImageBuffer(newCoverFile, 'sa-sewa/blog');
            if (post.imagePublicId) {
                await destroyImage(post.imagePublicId);
            }
            post.image = uploaded.secure_url;
            post.imagePublicId = uploaded.public_id;
        }

        // FIX 4: Handle gallery images append
        if (req.files && req.files.images && req.files.images.length > 0) {
            const uploadedGallery = await Promise.all(
                req.files.images.map((file) => uploadImageBuffer(file, 'sa-sewa/blog'))
            );
            const newUrls = uploadedGallery.map((item) => item.secure_url);
            const newIds = uploadedGallery.map((item) => item.public_id);
            post.images = (post.images || []).concat(newUrls);
            post.imagePublicIds = (post.imagePublicIds || []).concat(newIds);
        }

        await post.save();

        res.status(200).json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update blog post' });
    }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private
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
