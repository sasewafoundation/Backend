const express = require('express');
const { getDonations, addDonationInquiry, deleteDonation } = require('../controllers/donations');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
      .get(protect, getDonations) // Only admin can see donations
      .post(addDonationInquiry);  // Public can submit

router.route('/:id')
      .delete(protect, deleteDonation);

module.exports = router;
