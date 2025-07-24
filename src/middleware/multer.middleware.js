// src/middleware/multer.middleware.js (updated)

import multer from "multer"; // Use to upload file
import fs from 'fs';       // Import Node.js File System module
import path from 'path';     // Import Node.js Path module

// Define the absolute path for the temporary upload directory
// process.cwd() gives the current working directory of the Node.js process
const tempUploadDir = path.join(process.cwd(), 'public', 'temp');

// Ensure the temporary upload directory exists
// This block will run once when your application starts
if (!fs.existsSync(tempUploadDir)) {
    // If the directory does not exist, create it
    // { recursive: true } ensures that parent directories (like 'public') are also created if they don't exist
    fs.mkdirSync(tempUploadDir, { recursive: true });
    console.log(`Created temporary upload directory: ${tempUploadDir}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Now we are sure that tempUploadDir exists
        cb(null, tempUploadDir);
    },
    filename: function (req, file, cb) {
        // Keeping original filename as per your existing code
        // For production, consider adding a unique suffix (like you commented out)
        // to prevent potential filename collisions and security risks.
        // For example: `cb(null, Date.now() + '-' + file.originalname);`
        cb(null, file.originalname);
    }
});
 
export const upload = multer({ storage: storage });