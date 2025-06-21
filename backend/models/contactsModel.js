import { Schema, model, Types } from "mongoose";

const contactSchema = new Schema({
    owner: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    contactEmail: {
        type: String,
        required: false, 
    },
    contactPhoneNo: {
        type: String,
        required: false,
    },
    contactName: {
        type: String,
        required: true,
    },
    isRegistered: {
        type: Boolean,
        default: false,
    },
    linkedUser: {
        type: Types.ObjectId,
        ref: "User",
        default: null,
    }
}, {
    timestamps: true
});

const Contact = model("Contact", contactSchema);
export default Contact;