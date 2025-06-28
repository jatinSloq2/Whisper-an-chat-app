import Message from "../models/messagesModel.js";

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
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = req.file.path || req.file.url;

    if (!fileUrl) {
      console.error("❌ Upload failed: file URL not found in req.file");
      console.log("📦 Full req.file:\n", JSON.stringify(req.file, null, 2));
      return res.status(500).json({ message: "Upload failed" });
    }
    console.log("✅ File saved at:", fileUrl);
    console.log("📦 Full req.file:\n", JSON.stringify(req.file, null, 2));
    return res.status(200).json({ filePath: fileUrl });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res.status(500).send("Internal Server Error");
  }
};