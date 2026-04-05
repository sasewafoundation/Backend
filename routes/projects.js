const express = require('express');
const { getProjects, getProject, getProjectBySlug, createProject, updateProject, deleteProject } = require('../controllers/projects');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
      .get(getProjects)
      .post(protect, upload.safe(upload.array('images', 5)), createProject);

router.route('/:id')
      .get(getProject)
      .put(protect, upload.safe(upload.array('images', 5)), updateProject)
      .delete(protect, deleteProject);

router.get('/slug/:slug', getProjectBySlug);
router.get('/s/:slug', getProjectBySlug);

module.exports = router;
