const express = require('express');
const {
    getLocation,
    updateLocation,
    deleteLocation,
    getProjectLocations,
    createLocation,
} = require('../controllers/locations');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const locationUpload = upload.safe(upload.any());

// /api/locations/:id
router.route('/:id')
    .get(getLocation)
    .put(protect, locationUpload, updateLocation)
    .delete(protect, deleteLocation);

module.exports = router;
