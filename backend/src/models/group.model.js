import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      role: {
        type: String,
        enum: ["admin", "moderator", "member"],
        default: "member",
      }
    }],
    maxMembers: {
      type: Number,
      default: 100,
      max: 1000,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index để tìm kiếm nhóm nhanh hơn
groupSchema.index({ name: "text", description: "text" });
groupSchema.index({ "members.user": 1 });
groupSchema.index({ admin: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;