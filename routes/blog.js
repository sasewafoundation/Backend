const express = require('express');
const { getBlogPosts, getBlogPost, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost } = require('../controllers/blog');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
      .get(getBlogPosts)
      .post(protect, upload.safe(upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'images', maxCount: 10 }
      ])), createBlogPost);

router.route('/:id')
      .get(getBlogPost)
      .put(protect, upload.safe(upload.single('image')), updateBlogPost)
      .delete(protect, deleteBlogPost);

router.get('/s/:slug', getBlogPostBySlug);

module.exports = router;
