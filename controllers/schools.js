const School = require('../models/School');
const { uploadImageBuffer, destroyImage } = require('../config/cloudinary');

// Helper to safely parse JSON or array/object fields from multipart/form-data or JSON bodies
const parseJsonField = (field, fallback = []) => {
    if (!field) return fallback;
    if (typeof field === 'object') return field;
    try {
        return JSON.parse(field);
    } catch {
        return fallback;
    }
};

// Helper to sanitize numeric lat/lng/progress/studentCount
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

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
exports.getSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: schools.length,
            data: schools,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single school by ID
// @route   GET /api/schools/:id
// @access  Public
exports.getSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        res.status(200).json({ success: true, data: school });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create school
// @route   POST /api/schools
// @access  Private (Staff/Admin)
exports.createSchool = async (req, res) => {
    try {
        const {
            name,
            area,
            studentCount,
            principalName,
            contact,
            summary,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'School name is required' });
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

        // Parse student count
        let parsedStudentCount = null;
        if (studentCount !== undefined && studentCount !== '' && studentCount !== null) {
            const countNum = Number(studentCount);
            if (!Number.isNaN(countNum) && countNum >= 0) {
                parsedStudentCount = countNum;
            }
        }

        // Parse milestones
        const rawMilestones = parseJsonField(req.body.milestones, []);
        const milestones = Array.isArray(rawMilestones)
            ? rawMilestones.map((m) => ({
                title: typeof m === 'string' ? m : (m.title || ''),
                done: Boolean(m.done),
                completedOn: m.completedOn ? new Date(m.completedOn) : null,
            })).filter((m) => m.title.trim())
            : [];

        // Handle uploaded image files to Cloudinary
        let photos = [];
        let photoPublicIds = [];

        // Support direct photo URLs passed in body
        const rawPhotos = parseJsonField(req.body.photos, []);
        if (Array.isArray(rawPhotos)) {
            photos = rawPhotos.filter((url) => typeof url === 'string' && url.trim());
        }

        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(
                req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/schools'))
            );
            photos = photos.concat(uploaded.map((item) => item.secure_url));
            photoPublicIds = photoPublicIds.concat(uploaded.map((item) => item.public_id));
        }

        const school = await School.create({
            name: name.trim(),
            area: area ? area.trim() : '',
            lat,
            lng,
            studentCount: parsedStudentCount,
            principalName: principalName ? principalName.trim() : '',
            contact: contact ? contact.trim() : '',
            progressPercent,
            milestones,
            photos,
            photoPublicIds,
            summary: summary ? summary.trim() : '',
        });

        res.status(201).json({ success: true, data: school });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Failed to create school' });
    }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private (Staff/Admin)
exports.updateSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const {
            name,
            area,
            studentCount,
            principalName,
            contact,
            summary,
        } = req.body;

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'School name cannot be empty' });
            }
            school.name = name.trim();
        }

        if (area !== undefined) school.area = area.trim();
        if (principalName !== undefined) school.principalName = principalName.trim();
        if (contact !== undefined) school.contact = contact.trim();
        if (summary !== undefined) school.summary = summary.trim();

        // Validate and update coordinates
        if (req.body.lat !== undefined) {
            try {
                school.lat = parseCoordinate(req.body.lat, -90, 90, 'Latitude');
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }
        if (req.body.lng !== undefined) {
            try {
                school.lng = parseCoordinate(req.body.lng, -180, 180, 'Longitude');
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
            school.progressPercent = parsedProgress;
        }

        // Student count
        if (studentCount !== undefined) {
            if (studentCount === '' || studentCount === null) {
                school.studentCount = null;
            } else {
                const countNum = Number(studentCount);
                school.studentCount = !Number.isNaN(countNum) && countNum >= 0 ? countNum : null;
            }
        }

        // Milestones
        if (req.body.milestones !== undefined) {
            const rawMilestones = parseJsonField(req.body.milestones, []);
            school.milestones = Array.isArray(rawMilestones)
                ? rawMilestones.map((m) => ({
                    title: typeof m === 'string' ? m : (m.title || ''),
                    done: Boolean(m.done),
                    completedOn: m.completedOn ? new Date(m.completedOn) : null,
                })).filter((m) => m.title.trim())
                : [];
        }

        // Handle removed photos
        const removedPhotos = parseJsonField(req.body.removedPhotos, []);
        let currentPhotos = school.photos || [];
        let currentPublicIds = school.photoPublicIds || [];

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

        // Handle direct photo URLs sent
        if (req.body.photos !== undefined) {
            const directPhotos = parseJsonField(req.body.photos, []);
            if (Array.isArray(directPhotos)) {
                // If direct photos array is supplied, ensure we preserve matching elements
                // Any newly passed strings are added
                directPhotos.forEach((url) => {
                    if (typeof url === 'string' && url.trim() && !currentPhotos.includes(url.trim())) {
                        currentPhotos.push(url.trim());
                    }
                });
            }
        }

        // Upload any newly attached image files to Cloudinary
        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(
                req.files.map((file) => uploadImageBuffer(file, 'sa-sewa/schools'))
            );
            const newUrls = uploaded.map((item) => item.secure_url);
            const newIds = uploaded.map((item) => item.public_id);
            currentPhotos = currentPhotos.concat(newUrls);
            currentPublicIds = currentPublicIds.concat(newIds);
        }

        school.photos = currentPhotos;
        school.photoPublicIds = currentPublicIds;

        await school.save();

        res.status(200).json({ success: true, data: school });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to update school' });
    }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private (Staff/Admin)
exports.deleteSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Clean up Cloudinary photos if any
        if (school.photoPublicIds && school.photoPublicIds.length > 0) {
            await Promise.all(
                school.photoPublicIds.map((publicId) => destroyImage(publicId).catch(() => null))
            );
        }

        await School.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
