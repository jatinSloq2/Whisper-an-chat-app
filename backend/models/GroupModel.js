import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [{ type: mongoose.Schema.ObjectId, ref: "User", required: true }],
  admins: [{ type: mongoose.Schema.ObjectId, ref: "User", required: true }],
  messages: [{ type: mongoose.Schema.ObjectId, ref: "Message" }],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});


groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

groupSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Group = mongoose.model("Groups", groupSchema);
export default Group;
