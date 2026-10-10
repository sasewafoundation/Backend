const express = require('express');
const { getVolunteers, applyToVolunteer, updateVolunteerStatus, deleteVolunteer, getVolunteerCv } = require('../controllers/volunteers');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { formLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// FIX 13: Apply formLimiter on public volunteer submissions
router.route('/')
      .get(protect, getVolunteers)
      .post(formLimiter, upload.safe(upload.cv.single('cvFile')), applyToVolunteer);

router.route('/:id/cv')
      .get(protect, getVolunteerCv);

router.route('/:id')
      .put(protect, updateVolunteerStatus)
      .delete(protect, deleteVolunteer);

module.exports = router;
