const Project = require('../models/Project');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort('-createdAt');
        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getProjectBySlug = async (req, res) => {
    try {
        const project = await Project.findOne({ slug: req.params.slug });
        if (!project) return res.status(404).json({ success: false, message: 'Project narrative not found via slug.' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { title, description } = req.body;
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
        
        const projectData = {
           ...req.body,
           images: parsedImages,
           imagePublicIds
        };

        const project = await Project.create(projectData);
        res.status(201).json({ success: true, data: project });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'A project with a similar slug already exists. Please try a slightly different title.' });
        }
        return res.status(500).json({ success: false, message: err.message || 'Failed to create project' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        let parsedImages = project.images;
        let imagePublicIds = project.imagePublicIds || [];
        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/projects')));
            parsedImages = parsedImages.concat(uploaded.map((item) => item.secure_url));
            imagePublicIds = imagePublicIds.concat(uploaded.map((item) => item.public_id));
        }

        const projectData = {
            ...req.body,
            images: parsedImages,
            imagePublicIds
        };

        project = await Project.findByIdAndUpdate(req.params.id, projectData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update project' });
    }
};

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
