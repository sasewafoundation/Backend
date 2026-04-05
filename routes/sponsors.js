const express = require('express');
const { getSponsors, getSponsor, createSponsor, updateSponsor, deleteSponsor } = require('../controllers/sponsors');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
      .get(getSponsors)
      .post(protect, upload.safe(upload.single('logo')), createSponsor);

router.route('/:id')
      .get(getSponsor)
      .put(protect, upload.safe(upload.single('logo')), updateSponsor)
      .delete(protect, deleteSponsor);

module.exports = router;
