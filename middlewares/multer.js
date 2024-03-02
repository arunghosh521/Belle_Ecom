const multer = require('multer');
const sharp = require('sharp');

// Multer middleware configuration
const storage = multer.diskStorage({
  destination: function (req,file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req,file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg');
  }
});
const uploads = multer({ storage: storage });

// Sharp middleware function
const resizeAndSaveImages = async (files) => {
  const filenames = [];
  const sharpPromises = files.map(async (file, index) => {
    if (!file.mimetype.startsWith('image/')) {
      console.error(`File ${file.originalname} is not an image.`);
      return;
    }
    const filename = `image_${index + 1}.${Date.now()}.jpg`;
    const imagePath = `public/uploads/${filename}`;

    try {
      console.log(file.path);

      await sharp(file.path)
        .resize(250,  300, {
          fit: 'contain',
          withoutEnlargement: true,
          background: 'white',
        })
        .toFile(imagePath, { quality:  90 });
        filenames.push(filename);
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
    }
    

  });

  await Promise.all(sharpPromises);
  return filenames;
};


module.exports = {uploads, resizeAndSaveImages};