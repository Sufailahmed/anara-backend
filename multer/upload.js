import multer   from "multer"
import path  from "path"

// Set Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files in "uploads" directory
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname)); 
    }
});

// File Type Filter
const fileFilter = (req, file, cb) => {
    cb(null, true); // Accept all files
};

// Initialize Upload
 export const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});