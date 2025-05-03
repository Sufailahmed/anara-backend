import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage, getImages, editImage, uploadFile, deleteFile, getFiles, editFile, uploadDocFile, getDocuments } from '../controllers/uploadController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5 MB in bytes
    },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, JPG, and PNG files are allowed!'), false);
      }
    }
  });

  const fileUpload = multer({
    storage,
    // No file size or type restrictions for files
    limits: {
      fileSize: 100 * 1024 * 1024 // Optional: 100 MB max file size
    }
  });
// Signature routes
router.post('/upload', upload.single('image'), uploadImage);
router.delete('/delete/:public_id(*)', deleteImage);
router.get('/list', getImages);
router.put('/edit/:public_id(*)', upload.single('image'), editImage);

// Letter head routes
router.post('/file-upload', fileUpload.array('files'), uploadFile);
router.delete('/delete-file/:public_id(*)', deleteFile);
router.get('/list-files', getFiles);
router.put('/edit-file/:public_id(*)', fileUpload.single('file'), editFile);

// Document routes
router.post('/upload-documents',fileUpload.single('documents'), uploadDocFile);
router.get('/list-documents', getDocuments);

export default router;
