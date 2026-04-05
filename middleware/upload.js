const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const cvStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkImageFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/jpeg|image\/jpg|image\/png|image\/webp/.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    return cb(new Error('Images only (jpg, jpeg, png, webp).'));
}

function checkCvFileType(file, cb) {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document/.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }

    return cb(new Error('CV must be PDF, DOC, or DOCX.'));
}

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 6 * 1024 * 1024 },
    fileFilter: function fileFilter(req, file, cb) {
        checkImageFileType(file, cb);
    }
});

const cvUpload = multer({
    storage: cvStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: function fileFilter(req, file, cb) {
        checkCvFileType(file, cb);
    }
});

function safe(middleware) {
    return (req, res, next) => {
        middleware(req, res, (err) => {
            if (!err) return next();

            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: err.message });
            }

            return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
        });
    };
}

// Backward-compatible default export for existing routes
imageUpload.cv = cvUpload;
imageUpload.safe = safe;

module.exports = imageUpload;
