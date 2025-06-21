import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv"
import Message from "./models/messagesModel.js";
import Group from "./models/GroupModel.js";
import Contact from "./models/contactsModel.js"
import mongoose from "mongoose";
dotenv.config()

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const disconnect = (socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendMessage = async (message) => {
    console.log("📥 Incoming message:", message);
    try {
      const senderSocketId = userSocketMap.get(message.sender);
      const recipientSocketId = userSocketMap.get(message.recipient);
      const createdMessage = await Message.create(message);
      const fullMessage = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      let messageData = fullMessage.toObject();

      const customContact = await Contact.findOne({
        owner: new mongoose.Types.ObjectId(message.recipient),
        linkedUser: new mongoose.Types.ObjectId(message.sender),
      });
      console.log("Looking for contact where owner:", message.recipient, "and linkedUser:", message.sender);

      if (customContact) {
        messageData.recipient.contactName = customContact.contactName;
      } else {
        console.log("❌ No contact found for recipient:", message.recipient, "and sender:", message.sender);
      }
      console.log(messageData)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  };

  const sendGroupMessage = async (message) => {
    const { groupId, sender, content, messageType, fileUrl } = message;

    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: createdMessage._id },
    });

    const group = await Group.findById(groupId)
      .populate("members", "_id")
      .populate("admins", "_id");

    const finalData = { ...messageData._doc, groupId: group._id };
    console.log(`📤 Sent group message to group ${groupId}`, finalData);

    const sentTo = new Set();

    if (group && group.members) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId && !sentTo.has(memberSocketId)) {
          io.to(memberSocketId).emit("receive-group-message", finalData);
          sentTo.add(memberSocketId);
        }
      });
    }

    if (Array.isArray(group.admins)) {
      group.admins.forEach((admin) => {
        const adminSocketId = userSocketMap.get(admin._id.toString());
        if (adminSocketId && !sentTo.has(adminSocketId)) {
          io.to(adminSocketId).emit("receive-group-message", finalData);
          sentTo.add(adminSocketId);
        }
      });
    }
  };


  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection.");
    }
    socket.on("sendMessage", sendMessage)
    socket.on("send-group-message", sendGroupMessage)
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;