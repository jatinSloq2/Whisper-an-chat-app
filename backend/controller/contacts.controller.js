import mongoose from "mongoose";
import Message from "../models/messagesModel.js";
import User from "../models/userModel.js";
import Contact from "../models/contactsModel.js";

export const searchContacts = async (req, res) => {
    try {
        const { searchTerm } = req.body;
        if (searchTerm === undefined || searchTerm === null) {
            return res.status(400).send("searchTerm is required.");
        }
        const sanitizedSearchTerm = searchTerm.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
        const regex = new RegExp(sanitizedSearchTerm, "i");
        const contacts = await User.find({
            $and: [
                { _id: { $ne: req.userId } },
                {
                    $or: [
                        { firstName: regex },
                        { lastName: regex },
                        { email: regex },
                        { phoneNo: regex },
                    ],
                },
            ],
        });
        return res.status(200).json({ contacts });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getContactsDmList = async (req, res) => {
    try {
        let userId = req.userId;
        userId = new mongoose.Types.ObjectId(userId);

        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }],
                },
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$recipient",
                            else: "$sender",
                        },
                    },
                    lastMessageTime: { $first: "$timestamp" },
                    lastMessage: { $first: "$content" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contactInfo",
                },
            },
            {
                $unwind: "$contactInfo"
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    email: "$contactInfo.email",
                    phoneNo: "$contactInfo.phoneNo",
                    firstName: "$contactInfo.firstName",
                    lastName: "$contactInfo.lastName",
                    image: "$contactInfo.image",
                    color: "$contactInfo.color"
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);


        return res.status(200).json({ contacts });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAllContacts = async (req, res) => {
    try {
        const users = await User.find(
            { _id: { $ne: req.userId } },
            "firstName lastName _id email phoneNO"
        );

        const contacts = users.map((user) => ({
            label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
            value: user._id
        }));

        return res.status(200).json({ contacts });
    } catch (error) {
        console.log({ error });
        return res.status(500).send("Internal Server Error");
    }
};

export const addContact = async (req, res) => {
  try {
    const { contactEmail, contactPhoneNo, contactName } = req.body;
    const userId = req.userId;

    if (!contactName || (!contactEmail && !contactPhoneNo)) {
      return res.status(400).json({
        message: "Contact name and at least email or phone number is required.",
      });
    }

    // Build a dynamic search filter
    const userMatchQuery = [];
    const contactMatchQuery = [];

    if (contactEmail) {
      userMatchQuery.push({ email: contactEmail });
      contactMatchQuery.push({ contactEmail });
    }
    if (contactPhoneNo) {
      userMatchQuery.push({ phoneNo: contactPhoneNo });
      contactMatchQuery.push({ contactPhoneNo });
    }

    const existingUser = userMatchQuery.length
      ? await User.findOne({ $or: userMatchQuery })
      : null;

    // Prevent adding self
    if (existingUser && existingUser._id.toString() === userId) {
      return res.status(400).json({
        message: "You cannot add yourself as a contact.",
      });
    }

    // Check if this contact already exists in your list
    const existingContact = contactMatchQuery.length
      ? await Contact.findOne({
          owner: userId,
          $or: contactMatchQuery,
        })
      : null;

    if (existingContact) {
      return res.status(400).json({
        message: "Contact already exists in your contact list.",
      });
    }

    const newContact = await Contact.create({
      owner: userId,
      contactEmail: contactEmail || null,
      contactPhoneNo: contactPhoneNo || null,
      contactName,
      isRegistered: !!existingUser,
      linkedUser: existingUser?._id || null,
    });

    return res.status(201).json({
      message: "Contact added successfully.",
      contact: newContact,
    });
  } catch (error) {
    console.error("Add contact error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
