// backend/lib/cloudinary.js
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    // Allow any file type (use 'raw' resource_type)
    resource_type: 'auto', // this will detect file type automatically
    folder: 'showcase',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'txt', 'pdf', 'doc', 'docx'], // add text files
  },
});

const upload = multer({ storage });

module.exports = { cloudinary: cloudinary.v2, upload };