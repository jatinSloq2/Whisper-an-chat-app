import mongoose from "mongoose";
import Group from "../models/GroupModel.js";
import User from "../models/userModel.js";



export const createGroup = async (request, response) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;

    const admin = await User.findById(userId);
    if (!admin) {
      return response.status(400).send("Admin user not found.");
    }

    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return response.status(400).send("Some members are not valid users.");
    }

    const newGroup = new Group({
      name,
      members,
      admins: [userId],
    });

    await newGroup.save();
    return response.status(201).json({ group: newGroup });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal Server Error");
  }
};

export const getUserGroups = async (request, response) => {
  try {
    const userId = new mongoose.Types.ObjectId(request.userId);
    const groups = await Group.find({
      $or: [{ admins: userId }, { members: userId }],
    })
      .populate("members", "firstName lastName email image color")
      .populate("admins", "firstName lastName email")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: {
          path: "sender",
          select: "firstName lastName email image color",
        },

      })
      .sort({ updatedAt: -1 });

    const groupsWithLastMsg = groups.map((group) => {
      const lastMessageObj = group.messages?.[0];
      const lastMessage = lastMessageObj?.content || null;
      const lastMessageTime = lastMessageObj?.createdAt || null;

      return {
        _id: group._id,
        name: group.name,
        image: group.image,
        members: group.members,
        admins: group.admins,
        lastMessage,
        lastMessageTime,
        updatedAt: group.updatedAt,
        createdAt: group.createdAt,
        type: "group"
      };
    });
    return response.status(200).json({ groups: groupsWithLastMsg });
  } catch (error) {
    console.log("❌ Error in getUserGroups:", error);
    return response.status(500).send("Internal Server Error");
  }
};

export const getAllGroupMessages = async (req, res) => {
  try {
    const { groupId, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const group = await Group.findById(groupId).populate("messages");

    if (!group) {
      return res.status(404).send("Group not found");
    }

    const totalMessages = group.messages.length;

    const messages = await Message.find({ _id: { $in: group.messages } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "firstName lastName image email _id color");

    return res.status(200).json({
      messages: messages.reverse(), // maintain chronological order
      hasMore: skip + limit < totalMessages,
    });
  } catch (error) {
    console.log("🔥 Error in getAllGroupMessages:", error);
    return res.status(500).send("Internal Server Error");
  }
};


