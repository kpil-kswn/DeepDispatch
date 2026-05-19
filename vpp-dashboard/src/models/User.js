import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  name: {
    type: String,
  },
  image: {
    type: String,
  },
  isPro: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);