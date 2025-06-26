import mongoose from "mongoose";

const callDetailsSchema = new mongoose.Schema(
  {
    duration: Number,
    status: {
      type: String,
      enum: ["missed", "rejected", "answered"],
    },
    startedAt: Date,
    endedAt: Date,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messageType: {
      type: String,
      enum: ["text", "file", "audio", "video"],
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text";
      },
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.messageType === "file";
      },
    },
    callDetails: {
      type: callDetailsSchema,
      required: function () {
        return ["call", "video"].includes(this.messageType);
      },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
