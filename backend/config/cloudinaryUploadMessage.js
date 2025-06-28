import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const messageStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    return {
      folder: "chat_message_files",
      resource_type: "auto",
      public_id: `${Date.now()}-${file.originalname}`,
      allowed_formats: [
        "jpg", "jpeg", "png", "webp", "gif", "bmp",
        "mp4", "webm", "mov",
        "pdf", "docx", "txt", "zip"
      ],
    };
  },
});

const uploadMessage = multer({ storage: messageStorage });
export default uploadMessage;
