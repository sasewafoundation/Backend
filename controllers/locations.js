const Location = require('../models/Location');
const Project = require('../models/Project');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

// Helper to safely parse JSON or array/object fields
const parseJsonField = (field, fallback = []) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
        return JSON.parse(field);
    } catch {
        return fallback;
    }
};

// Helper to validate and parse coordinate
const parseCoordinate = (value, min, max, fieldName) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    if (num < min || num > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
    return num;
};

// @desc    Get all locations for a specific project
// @route   GET /api/projects/:projectId/locations
// @access  Public
exports.getProjectLocations = async (req, res) => {
    try {
        const { projectId } = req.params;
        const locations = await Location.find({ project: projectId }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: locations.length,
            data: locations,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single location by ID
// @route   GET /api/locations/:id
// @access  Public
exports.getLocation = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }
        res.status(200).json({ success: true, data: location });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create a new location for a project
// @route   POST /api/projects/:projectId/locations
// @access  Private (Staff/Admin)
exports.createLocation = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const { name, area, type, summary } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Location name is required' });
        }

        // Validate coordinates
        let lat = null;
        let lng = null;
        try {
            lat = parseCoordinate(req.body.lat, -90, 90, 'Latitude');
            lng = parseCoordinate(req.body.lng, -180, 180, 'Longitude');
        } catch (coordErr) {
            return res.status(400).json({ success: false, message: coordErr.message });
        }

        // Validate progress percent
        let progressPercent = 0;
        if (req.body.progressPercent !== undefined && req.body.progressPercent !== '') {
            const parsedProgress = Number(req.body.progressPercent);
            if (Number.isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'progressPercent must be a number between 0 and 100',
                });
            }
            progressPercent = parsedProgress;
        }

        // Parse details array of { label, value }
        const rawDetails = parseJsonField(req.body.details, []);
        const details = Array.isArray(rawDetails)
            ? rawDetails
                .filter((d) => d && typeof d === 'object' && d.label && d.value !== undefined && d.value !== null)
                .map((d) => ({ label: String(d.label).trim(), value: String(d.value).trim() }))
                .filter((d) => d.label && d.value)
            : [];

        // Parse milestones
        const rawMilestones = parseJsonField(req.body.milestones, []);
        const milestones = Array.isArray(rawMilestones)
            ? rawMilestones.map((m) => ({
                title: typeof m === 'string' ? m : (m.title || ''),
                done: Boolean(m.done),
                completedOn: m.completedOn ? new Date(m.completedOn) : null,
            })).filter((m) => m.title.trim())
            : [];

        // Photos handling
        let photos = [];
        let photoPublicIds = [];

        const rawPhotos = parseJsonField(req.body.photos, []);
        if (Array.isArray(rawPhotos)) {
            photos = rawPhotos.filter((url) => typeof url === 'string' && url.trim());
        }

        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(
                req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/locations'))
            );
            photos = photos.concat(uploaded.map((item) => item.secure_url));
            photoPublicIds = photoPublicIds.concat(uploaded.map((item) => item.public_id));
        }

        const location = await Location.create({
            project: project._id,
            name: name.trim(),
            area: area ? area.trim() : '',
            type: type ? type.trim() : 'Location',
            lat,
            lng,
            summary: summary ? summary.trim() : '',
            details,
            progressPercent,
            milestones,
            photos,
            photoPublicIds,
        });

        res.status(201).json({ success: true, data: location });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Failed to create location' });
    }
};

// @desc    Update a location
// @route   PUT /api/locations/:id
// @access  Private (Staff/Admin)
exports.updateLocation = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        const { name, area, type, summary } = req.body;
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Location name cannot be empty' });
            }
            location.name = name.trim();
        }

        if (area !== undefined) location.area = area.trim();
        if (type !== undefined) location.type = type.trim() || 'Location';
        if (summary !== undefined) location.summary = summary.trim();

        // Validate and update coordinates
        if (req.body.lat !== undefined) {
            try {
                location.lat = parseCoordinate(req.body.lat, -90, 90, 'Latitude');
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }
        if (req.body.lng !== undefined) {
            try {
                location.lng = parseCoordinate(req.body.lng, -180, 180, 'Longitude');
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // Validate and update progress percent
        if (req.body.progressPercent !== undefined) {
            const parsedProgress = Number(req.body.progressPercent);
            if (Number.isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'progressPercent must be a number between 0 and 100',
                });
            }
            location.progressPercent = parsedProgress;
        }

        // Update details
        if (req.body.details !== undefined) {
            const rawDetails = parseJsonField(req.body.details, []);
            location.details = Array.isArray(rawDetails)
                ? rawDetails
                    .filter((d) => d && typeof d === 'object' && d.label && d.value !== undefined && d.value !== null)
                    .map((d) => ({ label: String(d.label).trim(), value: String(d.value).trim() }))
                    .filter((d) => d.label && d.value)
                : [];
        }

        // Update milestones
        if (req.body.milestones !== undefined) {
            const rawMilestones = parseJsonField(req.body.milestones, []);
            location.milestones = Array.isArray(rawMilestones)
                ? rawMilestones.map((m) => ({
                    title: typeof m === 'string' ? m : (m.title || ''),
                    done: Boolean(m.done),
                    completedOn: m.completedOn ? new Date(m.completedOn) : null,
                })).filter((m) => m.title.trim())
                : [];
        }

        // Removed photos handling
        const removedPhotos = parseJsonField(req.body.removedPhotos, []);
        let currentPhotos = location.photos || [];
        let currentPublicIds = location.photoPublicIds || [];

        if (Array.isArray(removedPhotos) && removedPhotos.length > 0) {
            for (const urlToRemove of removedPhotos) {
                const index = currentPhotos.indexOf(urlToRemove);
                if (index !== -1) {
                    const publicId = currentPublicIds[index];
                    if (publicId) {
                        try {
                            await destroyImage(publicId);
                        } catch (destroyErr) {
                            console.warn('Failed to destroy Cloudinary image:', publicId);
                        }
                    }
                    currentPhotos.splice(index, 1);
                    currentPublicIds.splice(index, 1);
                }
            }
        }

        // Direct photos passed in body
        if (req.body.photos !== undefined) {
            const directPhotos = parseJsonField(req.body.photos, []);
            if (Array.isArray(directPhotos)) {
                directPhotos.forEach((url) => {
                    if (typeof url === 'string' && url.trim() && !currentPhotos.includes(url.trim())) {
                        currentPhotos.push(url.trim());
                    }
                });
            }
        }

        // Upload any newly attached files
        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(
                req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/locations'))
            );
            currentPhotos = currentPhotos.concat(uploaded.map((item) => item.secure_url));
            currentPublicIds = currentPublicIds.concat(uploaded.map((item) => item.public_id));
        }

        location.photos = currentPhotos;
        location.photoPublicIds = currentPublicIds;

        await location.save();

        res.status(200).json({ success: true, data: location });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update location' });
    }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private (Staff/Admin)
exports.deleteLocation = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        // Destroy associated Cloudinary photos
        if (location.photoPublicIds && location.photoPublicIds.length > 0) {
            await Promise.all(
                location.photoPublicIds.map((publicId) => destroyImage(publicId).catch(() => null))
            );
        }

        await Location.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
