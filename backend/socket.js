import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import Message from "./models/messagesModel.js";
import Group from "./models/GroupModel.js";
import Contact from "./models/contactsModel.js";
import mongoose from "mongoose";

dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "https://whisper-for-chat.netlify.app",
];
const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  const emitToUser = (userId, event, data) => {
    const sockets = userSocketMap.get(userId);
    if (!sockets) return;
    sockets.forEach((sockId) => {
      io.to(sockId).emit(event, data);
    });
  };

  const disconnect = (socket) => {
    for (const [userId, socketSet] of userSocketMap.entries()) {
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        userSocketMap.delete(userId);
      }
    }
  };

  const sendMessage = async (message) => {
    try {
      const createdMessage = await Message.create(message);
      const fullMessage = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");
      const messageData = fullMessage.toObject();
      const customContact = await Contact.findOne({ owner: new mongoose.Types.ObjectId(message.recipient), linkedUser: new mongoose.Types.ObjectId(message.sender), });
      if (customContact) messageData.recipient.contactName = customContact.contactName;
      emitToUser(message.recipient, "receiveMessage", messageData);
      emitToUser(message.sender, "receiveMessage", messageData);
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
    const allUsers = [...group.members, ...group.admins];
    const sentTo = new Set();
    allUsers.forEach((user) => {
      const userId = user._id.toString();
      const socketSet = userSocketMap.get(userId);
      if (socketSet) {
        socketSet.forEach((sockId) => {
          if (!sentTo.has(sockId)) {
            io.to(sockId).emit("receive-group-message", finalData);
            sentTo.add(sockId);
          }
        });
      }
    });
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId).add(socket.id);
    } else {
      console.warn("⚠️ No userId provided in handshake");
    }
    //-----------------------------------------------------------------
    socket.on("sendMessage", sendMessage);
    socket.on("send-group-message", sendGroupMessage);
    //-----------------------------------------------------------------
    socket.on("call-user", ({ to, offer, type, from }) => {
      if (!offer || !offer.type || !offer.sdp) {
        io.to(socket.id).emit("call-failed", {
          to,
          reason: "Invalid offer",
        });
        return;
      }
      emitToUser(to, "incoming-call", { from, offer, type });
      emitToUser(from, "call-init-sent", { to });
    });
    socket.on("check-user-availability", ({ to }, callback) => {
      const socketSet = userSocketMap.get(to);
      if (socketSet && socketSet.size > 0) {
        callback({ online: true });
      } else {
        callback({ online: false });
      }
    });
    socket.on("answer-call", ({ to, answer }) => {
      if (!answer?.type || !answer?.sdp) {
        return;
      }
      emitToUser(to, "call-answered", { answer });
    });
    socket.on("ice-candidate", ({ to, candidate }) => {
      if (candidate) {
        emitToUser(to, "ice-candidate", { candidate });
      }
    });
    socket.on("end-call", ({ to, from }) => {
      emitToUser(to, "call-ended");
      emitToUser(from, "call-ended");
    });
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default setupSocket;
