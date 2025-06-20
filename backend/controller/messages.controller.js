import path from "path";
import Message from "../models/messagesModel.js"
import fs, { renameSync, mkdirSync } from "fs";

export const getMessages = async (req, res) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;

    if (!user1 || !user2) {
      return res.status(400).send("Both user IDs are required.");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};


export const uploadFile = async (req, res) => {
  console.log("📥 Route hit with file:", req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const newFolder = "uploads/files";
    const newFilePath = path.join(newFolder, fileName);

    mkdirSync(newFolder, { recursive: true });
    renameSync(req.file.path, newFilePath);

    const filePathForClient = newFilePath.replace(/\\/g, "/");

    console.log("✅ File saved at:", filePathForClient);
    return res.status(200).json({ filePath: filePathForClient });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res.status(500).send("Internal Server Error");
  }
};