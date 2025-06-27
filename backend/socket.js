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

    const group = await Group.findById(groupId)
      .populate("members", "_id")
      .populate("admins", "_id");

    const allUsers = [...group.members, ...group.admins];
    const uniqueUsers = new Map();
    allUsers.forEach((u) => uniqueUsers.set(u._id.toString(), u)); // remove dups

    const statusMap = [...uniqueUsers.keys()]
      .filter((id) => id !== sender) // exclude sender
      .map((userId) => ({ user: userId, status: "sent" }));

    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
      statusMap,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color");

    const finalData = {
      ...messageData._doc,
      groupId: group._id,
      groupName: group.name,
      groupImage: group.image,
    };

    const sentTo = new Set();
    uniqueUsers.forEach((user, userId) => {
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
    socket.on("message-received", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { status: "received" },
          { new: true }
        )
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        if (updatedMessage?.sender?._id) {
          emitToUser(updatedMessage.sender._id.toString(), "messageStatusUpdate", {
            messageId,
            status: "received",
          });
        }
      } catch (err) {
        console.error("❌ Error marking message as received:", err);
      }
    });
    socket.on("message-read", async ({ messageId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "read",
            readAt: new Date(),
          },
          { new: true }
        )
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        if (updatedMessage?.sender?._id) {
          emitToUser(updatedMessage.sender._id.toString(), "messageStatusUpdate", {
            messageId,
            status: "read",
            readAt: updatedMessage.readAt,
          });
        }
      } catch (err) {
        console.error("❌ Error marking message as read:", err);
      }
    });
    socket.on("group-message-received", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const entry = message.statusMap.find((entry) => entry.user.toString() === userId);
        if (entry && entry.status === "sent") {
          entry.status = "received";
          await message.save();

          emitToUser(message.sender.toString(), "groupMessageStatusUpdate", {
            messageId,
            userId,
            status: "received",
          });
        }
      } catch (err) {
        console.error("❌ Failed to update group message as received:", err);
      }
    });
    socket.on("group-message-read", async ({ messageId, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const entry = message.statusMap.find((entry) => entry.user.toString() === userId);
        if (entry && entry.status !== "read") {
          entry.status = "read";
          entry.readAt = new Date();
          await message.save();

          emitToUser(message.sender.toString(), "groupMessageStatusUpdate", {
            messageId,
            userId,
            status: "read",
            readAt: entry.readAt,
          });
        }
      } catch (err) {
        console.error("❌ Failed to update group message as read:", err);
      }
    });
    //-----------------------------------------------------------------
    socket.on("call-user", ({ to, offer, type, from }) => {
      if (!offer || !offer.type || !offer.sdp) {
        io.to(socket.id).emit("call-failed", {
          to,
          reason: "Invalid offer",
        });
        return;
      }

      // Only store if not already active
      if (!activeCalls.has(from) && !activeCalls.has(to)) {
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
      if (peer !== to) {
        console.log("⚠️ Ignoring unrelated end-call from", from);
        return;
      }

      console.log("🔴 Ending valid call between:", from, "<->", to);
      activeCalls.delete(from);
      activeCalls.delete(to);

      emitToUser(to, "call-ended", { from });
      emitToUser(from, "call-ended", { to });
    });
    socket.on("store-call-log", async (payload) => {
      console.log(payload)
      const {
        sender,
        recipient,
        messageType,
        callDetails,
      } = payload;

      try {
        const message = await Message.create({
          sender,
          recipient,
          messageType,
          callDetails,
        });

        const fullMessage = await Message.findById(message._id)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        const customContact = await Contact.findOne({
          owner: new mongoose.Types.ObjectId(recipient),
          linkedUser: new mongoose.Types.ObjectId(sender),
        });

        const messageData = fullMessage.toObject();
        if (customContact) {
          messageData.recipient.contactName = customContact.contactName;
        }

        emitToUser(recipient, "receiveMessage", messageData);
        emitToUser(sender, "receiveMessage", messageData);

        console.log("📞 Call log saved successfully.");
      } catch (err) {
        console.error("❌ Failed to save call log:", err);
      }
    });
    socket.on("disconnect", () => {
      const userId = [...userSocketMap.entries()]
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];

      disconnect(socket);

      if (userId) {
        const peer = activeCalls.get(userId);
        if (peer) {
          activeCalls.delete(userId);
          activeCalls.delete(peer);
          emitToUser(peer, "call-ended", { from: userId });
        }
      }
    });
  });
};

export default setupSocket;