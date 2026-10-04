const express = require('express');
const { getDonations, addDonationInquiry, deleteDonation } = require('../controllers/donations');
const { protect } = require('../middleware/auth');
const { formLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// FIX 13: Apply formLimiter on public donation pledges
router.route('/')
      .get(protect, getDonations)
      .post(formLimiter, addDonationInquiry);

router.route('/:id')
      .delete(protect, deleteDonation);

module.exports = router;
