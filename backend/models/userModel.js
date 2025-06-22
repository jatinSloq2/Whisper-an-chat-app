import { Schema, model } from "mongoose";
import { hash, genSalt } from "bcryptjs";

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true
    },
    phoneNo: {
        type: String,
        required: [true, "Phone no is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false ,
        default : "uploads/profiles/profile-picture.png"
    },
    color: {
        type: Number,
        required: false
    },
    profileSetup: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
    next();
});

const User = model("User", userSchema);

export default User;
