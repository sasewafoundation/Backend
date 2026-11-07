const express = require('express');
const {
    getSchools,
    getSchool,
    createSchool,
    updateSchool,
    deleteSchool,
} = require('../controllers/schools');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Allow uploading up to 10 image files under either 'photos' or 'images'
const schoolUpload = upload.safe(upload.any());

router.route('/')
    .get(getSchools)
    .post(protect, schoolUpload, createSchool);

router.route('/:id')
    .get(getSchool)
    .put(protect, schoolUpload, updateSchool)
    .delete(protect, deleteSchool);

module.exports = router;
