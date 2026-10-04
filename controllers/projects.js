const Project = require('../models/Project');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

// Helper to generate consistent project slugs
const generateSlug = (title) => {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
        .trim();
    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort('-createdAt');
        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single project by slug
// @route   GET /api/projects/s/:slug or /projects/slug/:slug
// @access  Public
exports.getProjectBySlug = async (req, res) => {
    try {
        const project = await Project.findOne({ slug: req.params.slug });
        if (!project) return res.status(404).json({ success: false, message: 'Project narrative not found via slug.' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
    try {
        const { title, description, projectType, status, location, youtubeLink } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Project title and description are required' });
        }

        let parsedImages = [];
        let imagePublicIds = [];
        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/projects')));
            parsedImages = uploaded.map((item) => item.secure_url);
            imagePublicIds = uploaded.map((item) => item.public_id);
        }

        const project = await Project.create({
            title,
            description,
            projectType: projectType || '',
            status: status || 'Active',
            location: location || '',
            youtubeLink: youtubeLink || '',
            images: parsedImages,
            imagePublicIds
        });

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A project with a similar title already exists.' });
        }
        return res.status(500).json({ success: false, message: err.message || 'Failed to create project' });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
// FIX 9 & FIX 14: Support removing gallery images, destroying in Cloudinary, and syncing slug on title edit
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const { title, description, projectType, status, location, youtubeLink } = req.body;

        // FIX 14: Regenerate slug if title changed
        if (title && title !== project.title) {
            project.title = title;
            project.slug = generateSlug(title);
        }

        if (description !== undefined) project.description = description;
        if (projectType !== undefined) project.projectType = projectType;
        if (status !== undefined) project.status = status;
        if (location !== undefined) project.location = location;
        if (youtubeLink !== undefined) project.youtubeLink = youtubeLink;

        // FIX 9: Process removedImages array from frontend
        let removedImages = [];
        if (req.body.removedImages) {
            try {
                removedImages = typeof req.body.removedImages === 'string'
                    ? JSON.parse(req.body.removedImages)
                    : req.body.removedImages;
            } catch (e) {
                removedImages = [];
            }
        }

        let currentImages = project.images || [];
        let currentPublicIds = project.imagePublicIds || [];

        if (Array.isArray(removedImages) && removedImages.length > 0) {
            for (const urlToRemove of removedImages) {
                const index = currentImages.indexOf(urlToRemove);
                if (index !== -1) {
                    const publicId = currentPublicIds[index];
                    if (publicId) {
                        try {
                            await destroyImage(publicId);
                        } catch (destroyErr) {
                            console.warn('Failed to destroy Cloudinary image:', publicId);
                        }
                    }
                    currentImages.splice(index, 1);
                    currentPublicIds.splice(index, 1);
                }
            }
        }

        // Upload any newly selected gallery files
        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/projects')));
            const newUrls = uploaded.map((item) => item.secure_url);
            const newIds = uploaded.map((item) => item.public_id);
            currentImages = currentImages.concat(newUrls);
            currentPublicIds = currentPublicIds.concat(newIds);
        }

        project.images = currentImages;
        project.imagePublicIds = currentPublicIds;

        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update project' });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        if (project.imagePublicIds && project.imagePublicIds.length > 0) {
            await Promise.all(project.imagePublicIds.map((publicId) => destroyImage(publicId)));
        }

        await Project.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
