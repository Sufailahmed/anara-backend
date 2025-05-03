import { cloudinaryInstance as cloudinary } from "../config/cloudinary.js";
import { Signature } from '../models/signatureModel.js';
import { LetterHead } from "../models/letterHeadModel.js";
import { Document } from "../models/Documents.js";

export const uploadImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      console.log(req.body);
      const { userId, userName } = req.body;

      if (!userId || !userName) {
        return res.status(400).json({ message: "User ID and name are required" });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'signatures', // ✅ Optional folder name in Cloudinary
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const signature = await Signature.create({
        url: result.secure_url,
        public_id: result.public_id,
        userId: userId,
        name: userName
      });

      return res.status(200).json({
        message: "Image uploaded successfully",
        data: signature
      });
  
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        message: "Something went wrong",
        error: error.message,
      });
    }
  };

  export const deleteImage = async (req, res) => {
    const { public_id } = req.params;
  
    try {
      const result = await cloudinary.uploader.destroy(public_id);
  
      const deletedSignature = await Signature.findOneAndDelete({ public_id });

      if (deletedSignature) {
        return res.status(200).json({
          message: "Image deleted successfully from both Cloudinary and the database",
        });
      } else {
        return res.status(404).json({
          message: "Image not found in the database",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      return res.status(500).json({
        message: "Something went wrong",
        error: error.message,
      });
    }
  };
  

export const getImages = async (req, res) => {
  try {
    const imageUrls = await Signature.find().select("url public_id userId name -_id");

    return res.status(200).json({ images: imageUrls });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch images",
      error: error.message,
    });
  }
};
  
export const editImage = async (req, res) => {
  const { public_id } = req.params;

  try {

    // Step 1: Find the image in the database by its public_id
    const signature = await Signature.findOne({ public_id });
    
    if (!signature) {
      return res.status(404).json({ message: "Signature not found" });
    }

    // Step 2: Delete the old image from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(public_id);
    if (cloudinaryResult.result !== "ok") {
      return res.status(500).json({ message: "Failed to delete old image from Cloudinary" });
    }

    // Step 3: Upload the new image to Cloudinary
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "signatures",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Step 4: Update the Signature table with the new image URL and public_id
    signature.url = result.secure_url;
    signature.public_id = result.public_id;

    await signature.save(); 
    return res.status(200).json({
      message: "Image replaced successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const {subject, body_text, image_id} = req.body;
   
    const fileLinks = [];
    const publicIds = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'files',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      fileLinks.push(result.secure_url,);
      publicIds.push(result.public_id);
    }

    const letterHead = await LetterHead.create({
      file_link: fileLinks,
      public_id: publicIds,
      image_id: image_id,
      subject: subject,
      body_text: body_text
    });

    return res.status(200).json({
      message: "File uploaded successfully",
      data: letterHead
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteFile = async (req, res) => {
  const { public_id } = req.params;

  try {
    // Step 1: Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(public_id);

    if (cloudinaryResult.result !== "ok") {
      return res.status(404).json({
        message: "File not found on Cloudinary or already deleted",
      });
    }

    // Step 2: Delete from MongoDB
    const deletedFile = await LetterHead.findOneAndDelete({ public_id });

    if (!deletedFile) {
      return res.status(404).json({
        message: "File record not found in database",
      });
    }

    return res.status(200).json({
      message: "File deleted successfully from both Cloudinary and database",
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const getFiles = async (req, res) => {
try {
  const files = await LetterHead.find().select("file_link image_id public_id subject body_text -_id");

  return res.status(200).json({ files });
} catch (error) {
  return res.status(500).json({
    message: "Failed to fetch images",
    error: error.message,
  });
}
};

export const editFile = async (req, res) => {
const { public_id } = req.params;

try {

  const oldFile = await LetterHead.findOne({  public_id });

  if (!oldFile) {
    return res.status(404).json({ message: "File not found" });
  }
  // Step 1: Delete the old file
  await cloudinary.uploader.destroy(public_id);

  // Step 2: Upload new file
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file provided" });
  }

  // Step 4: Upload new file
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "files",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  // Step 5: Update database record
  oldFile.file_link = result.secure_url;
  oldFile.public_id = result.public_id;
  if (req.body.subject) oldFile.subject = req.body.subject;
  if (req.body.body_text) oldFile.body_text = req.body.body_text;
  await oldFile.save();

  return res.status(200).json({
    message: "File updated successfully",
    data: oldFile,
  });

} catch (error) {
  return res.status(500).json({
    message: "Something went wrong",
    error: error.message,
  });
}
};

export const uploadDocFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "documents",
          resource_type: "auto", // handles PDFs, docs, etc.
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const newDoc = await Document.create({
      file_name: req.file.originalname,
      file_link: result.secure_url,
      public_id: result.public_id,
    });

    return res.status(200).json({
      message: "Document uploaded successfully",
      data: newDoc,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 }); // newest first
    return res.status(200).json({
      message: "Documents retrieved successfully",
      data: documents,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};