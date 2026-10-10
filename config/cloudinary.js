const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function ensureCloudinaryConfig() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary env values are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }
}

function uploadImageBuffer(file, folder) {
    ensureCloudinaryConfig();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (err, result) => {
                if (err) return reject(err);
                return resolve(result);
            }
        );

        stream.end(file.buffer);
    });
}

async function uploadCv(file, folder = 'sa-sewa/resumes') {
    ensureCloudinaryConfig();

    if (file.buffer) {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto',
                },
                (err, result) => {
                    if (err) return reject(err);
                    return resolve(result);
                }
            );

            stream.end(file.buffer);
        });
    }

    if (file.path) {
        return await cloudinary.uploader.upload(file.path, {
            folder,
            resource_type: 'auto',
        });
    }

    throw new Error('No file buffer or file path found on uploaded file.');
}

async function destroyImage(publicId) {
    if (!publicId) return;
    ensureCloudinaryConfig();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
    uploadImageBuffer,
    uploadCv,
    destroyImage,
};
