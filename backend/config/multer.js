import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    resource_type: "auto",
    allowed_formats: [
      "jpg", "jpeg", "png", "webp", "gif", "bmp",
      "mp4", "webm", "mov",
      "pdf", "docx", "txt", "zip"
    ],
  },
});

const upload = multer({ storage });
export default upload;