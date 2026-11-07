const Project = require('../models/Project');
const Location = require('../models/Location');
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

// Helper to safely parse JSON
const parseJsonField = (field, fallback = null) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
        return JSON.parse(field);
    } catch {
        return fallback;
    }
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

// @desc    Get project map data and its locations
// @route   GET /api/projects/:slug/map
// @access  Public
exports.getProjectMap = async (req, res) => {
    try {
        const { slug } = req.params;
        const project = await Project.findOne({ slug });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Return 404 if mapEnabled is false
        if (!project.mapSettings || !project.mapSettings.mapEnabled) {
            return res.status(404).json({ success: false, message: 'Map is not enabled for this project' });
        }

        const locations = await Location.find({ project: project._id }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            project: {
                id: project._id,
                name: project.title,
                title: project.title,
                slug: project.slug,
                about: project.summary || (project.description ? project.description.slice(0, 160) : ''),
                summary: project.summary || '',
                description: project.description,
                startDate: project.startDate,
                projectType: project.projectType,
                status: project.status,
                mapSettings: project.mapSettings,
                regionName: project.mapSettings?.regionName || '',
                regionGeoJSON: project.mapSettings?.regionGeoJSON || null,
            },
            locations,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            summary,
            projectType,
            status,
            location,
            youtubeLink,
            startDate,
            slug,
        } = req.body;

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

        // Parse map settings if passed
        let mapSettings = parseJsonField(req.body.mapSettings, { mapEnabled: false, regionName: '', regionGeoJSON: null });
        if (req.body.mapEnabled !== undefined) {
            mapSettings = mapSettings || {};
            mapSettings.mapEnabled = String(req.body.mapEnabled) === 'true' || Boolean(req.body.mapEnabled);
        }
        if (req.body.regionName !== undefined) {
            mapSettings = mapSettings || {};
            mapSettings.regionName = String(req.body.regionName).trim();
        }

        const project = await Project.create({
            title: title.trim(),
            description,
            summary: summary ? summary.trim() : '',
            projectType: projectType || '',
            status: status || 'Active',
            location: location || '',
            youtubeLink: youtubeLink || '',
            startDate: startDate ? new Date(startDate) : null,
            slug: slug ? slug.trim().toLowerCase().replace(/[^\w-]+/g, '') : undefined,
            images: parsedImages,
            imagePublicIds,
            mapSettings,
        });

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A project with a similar title or slug already exists.' });
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

        const {
            title,
            description,
            summary,
            projectType,
            status,
            location,
            youtubeLink,
            startDate,
            slug,
        } = req.body;

        // Custom slug or regenerate if title changed
        if (slug && slug.trim() && slug.trim() !== project.slug) {
            project.slug = slug.trim().toLowerCase().replace(/[^\w-]+/g, '');
        } else if (title && title !== project.title && !project.slug) {
            project.slug = generateSlug(title);
        }

        if (title !== undefined) project.title = title.trim();
        if (description !== undefined) project.description = description;
        if (summary !== undefined) project.summary = summary.trim();
        if (projectType !== undefined) project.projectType = projectType;
        if (status !== undefined) project.status = status;
        if (location !== undefined) project.location = location;
        if (youtubeLink !== undefined) project.youtubeLink = youtubeLink;
        if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;

        // Map settings
        if (req.body.mapSettings !== undefined) {
            const parsedMapSettings = parseJsonField(req.body.mapSettings, project.mapSettings || {});
            project.mapSettings = { ...project.mapSettings, ...parsedMapSettings };
        }
        if (req.body.mapEnabled !== undefined) {
            project.mapSettings = project.mapSettings || {};
            project.mapSettings.mapEnabled = String(req.body.mapEnabled) === 'true' || Boolean(req.body.mapEnabled);
        }
        if (req.body.regionName !== undefined) {
            project.mapSettings = project.mapSettings || {};
            project.mapSettings.regionName = String(req.body.regionName).trim();
        }

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
