import mongoose from "mongoose";
import Message from "../models/messagesModel.js";
import User from "../models/userModel.js";
import Contact from "../models/contactsModel.js";

export const searchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const userId = req.userId;

    if (!searchTerm) {
      return res.status(400).json({ message: "searchTerm is required." });
    }

    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizedSearchTerm, "i");

    // Search only within this user's contacts
    const contacts = await Contact.find({
      owner: userId,
      $or: [
        { contactName: regex },
        { contactEmail: regex },
        { contactPhoneNo: regex },
      ],
    }).populate("linkedUser", "firstName lastName email phoneNo image color");

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Search contacts error:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getContactsDmList = async (req, res) => {
  try {
    let userId = new mongoose.Types.ObjectId(req.userId);
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$createdAt" },
          lastMessage: { $first: "$content" },
        },
      },
      // Lookup the user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      { $unwind: "$contactInfo" },
      {
        $lookup: {
          from: "contacts",
          let: { contactId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$linkedUser", "$$contactId"] },
                    { $eq: ["$owner", userId] },
                  ],
                },
              },
            },
            {
              $project: {
                contactName: 1,
              },
            },
          ],
          as: "customContact",
        },
      },
      {
        $addFields: {
          contactName: {
            $cond: [
              { $gt: [{ $size: "$customContact" }, 0] },
              { $arrayElemAt: ["$customContact.contactName", 0] },
              null,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          contactName: 1,
          email: "$contactInfo.email",
          phoneNo: "$contactInfo.phoneNo",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $addFields: {
          type: "contact"
        }
      }
    ]);
    return res.status(200).json({ contacts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const userId = req.userId;
    const userContacts = await Contact.find({ owner: userId });
    const allEmails = userContacts.map((c) => c.contactEmail).filter(Boolean);
    const allPhones = userContacts.map((c) => c.contactPhoneNo).filter(Boolean);
    const matchedUsers = await User.find({
      $or: [
        { email: { $in: allEmails } },
        { phoneNo: { $in: allPhones } },
      ],
    }, "firstName lastName _id email phoneNo image");

    const contacts = userContacts.map((contact) => {
      let matchedUser = matchedUsers.find(
        (u) =>
          u.email === contact.contactEmail ||
          u.phoneNo === contact.contactPhoneNo
      );
      const label =
        contact.contactName ||
        `${matchedUser?.firstName ?? ""} ${matchedUser?.lastName ?? ""}`.trim() ||
        matchedUser?.email ||
        matchedUser?.phoneNo ||
        "Unnamed";
      return {
        label,
        value: matchedUser?._id || contact._id,
        isRegistered: !!matchedUser,
        image: matchedUser?.image || null,
      };
    });

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error in getAllContacts:", error);
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
