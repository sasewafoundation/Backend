const express = require('express');
const { createMessage, getMessages, deleteMessage } = require('../controllers/messages');
const { protect } = require('../middleware/auth');
const { formLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// FIX 13: Apply formLimiter on public contact form submissions
router.route('/')
      .post(formLimiter, createMessage)
      .get(protect, getMessages);

router.route('/:id')
      .delete(protect, deleteMessage);

module.exports = router;
