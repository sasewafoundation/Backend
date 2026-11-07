const express = require('express');
const {
    getProjects,
    getProject,
    getProjectBySlug,
    getProjectMap,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/projects');
const {
    getProjectLocations,
    createLocation,
} = require('../controllers/locations');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const locationUpload = upload.safe(upload.any());

router.route('/')
      .get(getProjects)
      .post(protect, upload.safe(upload.array('images', 5)), createProject);

// Public project map endpoint: GET /api/projects/:slug/map
router.get('/:slug/map', getProjectMap);

// Locations under a project: GET and POST /api/projects/:projectId/locations
router.route('/:projectId/locations')
      .get(getProjectLocations)
      .post(protect, locationUpload, createLocation);

router.route('/:id')
      .get(getProject)
      .put(protect, upload.safe(upload.array('images', 5)), updateProject)
      .delete(protect, deleteProject);

router.get('/slug/:slug', getProjectBySlug);
router.get('/s/:slug', getProjectBySlug);

module.exports = router;
