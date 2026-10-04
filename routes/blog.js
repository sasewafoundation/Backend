const express = require('express');
const { 
    getBlogPosts, 
    getBlogPost, 
    getBlogPostBySlug, 
    createBlogPost, 
    updateBlogPost, 
    deleteBlogPost 
} = require('../controllers/blog');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

const blogUploadFields = upload.safe(upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]));

// FIX 15: Use optionalAuth so getBlogPosts knows whether caller is an authenticated admin or public
router.route('/')
      .get(optionalAuth, getBlogPosts)
      .post(protect, blogUploadFields, createBlogPost);

// FIX 4: Update PUT route to support both single 'image' and 'images' gallery uploads
router.route('/:id')
      .get(getBlogPost)
      .put(protect, blogUploadFields, updateBlogPost)
      .delete(protect, deleteBlogPost);

router.get('/s/:slug', optionalAuth, getBlogPostBySlug);

module.exports = router;
