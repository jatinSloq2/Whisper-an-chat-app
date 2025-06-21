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
      admin: userId,
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
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return response.status(201).json({ groups });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const getAllGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.query;
    console.log("📥 groupId from query:", groupId);

    const group = await Group.findById(groupId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName image email _id color"
      }
    });

    if (!group) {
      console.log("❌ Group not found");
      return res.status(404).send("Group not found");
    }

    const messages = group.messages;
    console.log("✅ Group found. Messages:", messages.length);
    return res.status(200).json({ messages });
  } catch (error) {
    console.log("🔥 Error in getAllGroupMessages:", error);
    return res.status(500).send("Internal Server Error");
  }
};
