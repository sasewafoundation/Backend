const express = require('express');
const { createMessage, getMessages, deleteMessage } = require('../controllers/messages');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
      .post(createMessage)
      .get(protect, getMessages);

router.route('/:id')
      .delete(protect, deleteMessage);

module.exports = router;
