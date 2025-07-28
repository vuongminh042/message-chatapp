import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    deliveredAt: {
      type: Date
    },
    seenAt: {
      type: Date
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    messageType: {
      type: String,
      enum: ["private", "group"],
      default: "private"
    }
  },
  { timestamps: true }
);

// Validation để đảm bảo message có receiverId hoặc groupId
messageSchema.pre('save', function(next) {
  if (!this.receiverId && !this.groupId) {
    next(new Error('Message phải có receiverId hoặc groupId'));
  } else if (this.receiverId && this.groupId) {
    next(new Error('Message không thể có cả receiverId và groupId'));
  } else {
    next();
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
