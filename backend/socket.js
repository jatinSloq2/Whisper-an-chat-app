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
  const activeCalls = new Map();

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
        emitToUser(from, "call-failed", {
          to,
          reason: "Invalid offer",
        });
        return;
      }

      // Improved busy check:
      const fromBusy = activeCalls.has(from);
      const toBusy = activeCalls.has(to);

      if (!fromBusy && !toBusy) {
        activeCalls.set(from, to);
        activeCalls.set(to, from);
        emitToUser(to, "incoming-call", { from, offer, type });
        emitToUser(from, "call-init-sent", { to });
      } else {
        emitToUser(from, "user-busy", { to });
      }
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
      const peer = activeCalls.get(from);

      // ❌ From user is not part of an active call — reject
      if (!peer) {
        console.warn("⚠️ No active call found for", from);
        return;
      }

      // ✅ If the peer matches or the 'to' is the expected peer
      if (peer === to) {
        console.log("🔴 Valid end call from", from, "<->", to);
        activeCalls.delete(from);
        activeCalls.delete(to);
        emitToUser(to, "call-ended", { from });
        emitToUser(from, "call-ended", { to });
      } else {
        // ❌ Block malicious attempt by third user (e.g., User 3 trying to end 1 & 2)
        console.warn("❌ Unauthorized end-call attempt from", from, "to", to);
      }
    });
    socket.on("call-timeout", ({ from, to }) => {
      activeCalls.delete(from);
      activeCalls.delete(to);
      emitToUser(to, "call-ended", { from });
      emitToUser(from, "call-ended", { to });
    });

    socket.on("user-busy", ({ from, to }) => {
      activeCalls.delete(from);
      activeCalls.delete(to);
    });
    socket.on("store-call-log", async (payload) => {
      const { sender, recipient, messageType, callDetails, } = payload;
      try {
        const message = await Message.create({ sender, recipient, messageType, callDetails, })
        const fullMessage = await Message.findById(message._id)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");
        const customContact = await Contact.findOne({ owner: new mongoose.Types.ObjectId(recipient), linkedUser: new mongoose.Types.ObjectId(sender), });
        const messageData = fullMessage.toObject();
        if (customContact) messageData.recipient.contactName = customContact.contactName;
        emitToUser(recipient, "receiveMessage", messageData);
        emitToUser(sender, "receiveMessage", messageData);
      } catch (err) {
        console.error("❌ Failed to save call log:", err);
      }
    });

    socket.on("disconnect", () => {
      disconnect(socket);
      const logActiveCalls = () => {
        console.log("📞 Active Calls:");
        for (const [a, b] of activeCalls.entries()) {
          console.log(`${a} <--> ${b}`);
        }
      };

      for (const [userId, sockets] of userSocketMap.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSocketMap.delete(userId);

            const peerId = activeCalls.get(userId);
            if (peerId) {
              activeCalls.delete(userId);
              activeCalls.delete(peerId);
              emitToUser(peerId, "call-ended", { from: userId });
            }
          }
        }
      }
    })
  });
};

export default setupSocket;
