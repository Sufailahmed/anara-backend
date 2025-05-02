import puppeteer from 'puppeteer';
import { cloudinaryInstance } from "../config/cloudinary.js";
import PDFFile from '../models/pdfFile.js'; // Assuming you have a PDFFile model
import fs from 'fs/promises';
import path from 'path';

export const generateLetterheadPDF = async (req, res) => {
    console.log("📝 PDF Generation triggered");
  
    try {
        const { htmlContent, subject } = req.body;

        if (!htmlContent) {
            return res.status(400).json({ error: "HTML content is required" });
        }

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: "new", // or `true` depending on Puppeteer version
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF buffer
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        // Ensure tmp directory exists
        const tmpDir = path.resolve('./tmp');
        await fs.mkdir(tmpDir, { recursive: true });

        // Save PDF to temp file
        const tempPath = path.join(tmpDir, `${Date.now()}.pdf`);
        await fs.writeFile(tempPath, pdfBuffer);

        // Upload PDF to Cloudinary
        const uploadResult = await cloudinaryInstance.uploader.upload(tempPath, {
            resource_type: "raw", // For PDFs
            folder: "letterheads"
        });

        // Clean up temp file
        await fs.unlink(tempPath);

        // Store PDF metadata in the database
        const pdfRecord = await PDFFile.create({
            subject,             // Subject of the letterhead
            cloudinary_url: uploadResult.secure_url,  // URL of the uploaded PDF
            public_id: uploadResult.public_id  // Cloudinary's unique public ID
        });

        // Return the PDF URL in the response
        res.status(201).json({ message: 'PDF generated', url: uploadResult.secure_url });
    } catch (err) {
        console.error("❌ PDF Generation Error:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
};
