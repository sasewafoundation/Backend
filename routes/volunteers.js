const express = require('express');
const { getVolunteers, applyToVolunteer, updateVolunteerStatus, deleteVolunteer } = require('../controllers/volunteers');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
      .get(protect, getVolunteers) // Only admin can list
      .post(upload.safe(upload.cv.single('cvFile')), applyToVolunteer); // Public can apply

router.route('/:id')
      .put(protect, updateVolunteerStatus)
      .delete(protect, deleteVolunteer);

module.exports = router;
