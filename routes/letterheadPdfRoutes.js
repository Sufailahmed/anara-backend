import express from 'express';
import { generateLetterheadPDF } from '../controllers/letterheadPdfController.js';

const router = express.Router();


router.post('/generatepdf', generateLetterheadPDF);

export default router;
