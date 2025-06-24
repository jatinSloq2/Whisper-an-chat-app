import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import Message from "./models/messagesModel.js";
import Group from "./models/GroupModel.js";
import Contact from "./models/contactsModel.js";
import mongoose from "mongoose";

dotenv.config();

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
    console.log(`❌ Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendMessage = async (message) => {
    try {
      const senderSocketId = userSocketMap.get(message.sender);
      const recipientSocketId = userSocketMap.get(message.recipient);

      const createdMessage = await Message.create(message);
      const fullMessage = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");

      const messageData = fullMessage.toObject();

      const customContact = await Contact.findOne({
        owner: new mongoose.Types.ObjectId(message.recipient),
        linkedUser: new mongoose.Types.ObjectId(message.sender),
      });

      if (customContact) {
        messageData.recipient.contactName = customContact.contactName;
      }

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      console.error("💥 Error in sendMessage:", error);
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
      .populate("sender", "id email firstName lastName image color");

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: createdMessage._id },
    });

    const group = await Group.findById(groupId)
      .populate("members", "_id")
      .populate("admins", "_id");

    const finalData = {
      ...messageData._doc,
      groupId: group._id,
      groupName: group.name,
      groupImage: group.image,
    };

    const sentTo = new Set();

    const allUsers = [...group.members, ...group.admins];

    allUsers.forEach((user) => {
      const userId = user._id.toString();
      const socketId = userSocketMap.get(userId);
      if (socketId && !sentTo.has(socketId)) {
        io.to(socketId).emit("receive-group-message", finalData);
        sentTo.add(socketId);
      }
    });
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`✅ User connected: ${userId} | Socket ID: ${socket.id}`);
    } else {
      console.warn("⚠️ No userId provided in handshake");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("send-group-message", sendGroupMessage);

    // 🔔 Call: Sending call request
    socket.on("call-user", ({ to, offer, type, from }) => {
      console.log("📞 Incoming call attempt from:", from, "to:", to);
      console.log("📤 Offer details:", offer);

      if (!offer || !offer.type || !offer.sdp) {
        console.error("❌ Invalid offer or recipient not found");
        console.log("📤 Offer details:", offer);
      
      }

      const recipientSocketId = userSocketMap.get(to);

      if (recipientSocketId && offer?.type && offer?.sdp) {
        io.to(recipientSocketId).emit("incoming-call", { from, offer, type });
        io.to(socket.id).emit("call-init-sent", { to });
      } else {
        console.warn("❌ Invalid offer or recipient not found");
        io.to(socket.id).emit("call-failed", {
          to,
          reason: "User not online or invalid offer",
        });
      }
    });

    // 📲 Call answered
    socket.on("answer-call", ({ to, answer }) => {
      const callerSocketId = userSocketMap.get(to);
      if (callerSocketId && answer?.type && answer?.sdp) {
        io.to(callerSocketId).emit("call-answered", { answer });
      } else {
        console.warn("⚠️ Invalid answer or caller not connected");
      }
    });

    // 🧊 ICE candidate relay
    socket.on("ice-candidate", ({ to, candidate }) => {
      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId && candidate) {
        console.log(`[ICE] Relaying candidate to ${to}`);
        io.to(recipientSocketId).emit("ice-candidate", { candidate });
      }
    });

    // 📴 End call
    socket.on("end-call", ({ to }) => {
      console.log(`[CALL] End call to ${to}`);
      const recipientSocketId = userSocketMap.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call-ended");
      }
    });

    // 🔌 Handle disconnect
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
