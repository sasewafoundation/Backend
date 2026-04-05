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

async function destroyImage(publicId) {
    if (!publicId) return;
    ensureCloudinaryConfig();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
    uploadImageBuffer,
    destroyImage,
};
