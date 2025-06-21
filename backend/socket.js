import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv"
import Message from "./models/messagesModel.js";
import Group from "./models/GroupModel.js";

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
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color");
      console.log("📨 MessageData:", messageData);
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

    const group = await Group.findById(groupId).populate("members");
    const finalData = { ...messageData._doc, groupId: group._id }
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

      if (group.admin?._id) {
        const adminSocketId = userSocketMap.get(group.admin._id.toString());
        if (adminSocketId && !sentTo.has(adminSocketId)) {
          io.to(adminSocketId).emit("receive-group-message", finalData);
        }
      }
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