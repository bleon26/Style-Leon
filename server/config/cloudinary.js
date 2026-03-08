const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'style-leon',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit generally
});

const deleteImageByUrl = async (url) => {
    if (!url || !url.includes('cloudinary.com')) return;
    try {
        const splitUrl = url.split('/');
        const filename = splitUrl.pop();
        const folder = splitUrl.pop();
        const publicId = `${folder}/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log(`Eliminado de Cloudinary: ${publicId}`);
    } catch (err) {
        console.error('Error al eliminar de Cloudinary:', err);
    }
};

module.exports = { cloudinary, upload, deleteImageByUrl };
