import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, video, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let videoUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (video) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(video, {
          resource_type: "video",
          chunk_size: 6000000,
          eager: [
            { 
              format: "mp4",
              transformation: [
                { width: 380, crop: "scale" },
                { quality: "auto:low" }
              ]
            }
          ],
          eager_async: true
        });
        videoUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading video:", uploadError);
        return res.status(400).json({ 
          error: "Không thể tải lên video. Vui lòng kiểm tra kích thước và định dạng video." 
        });
      }
    }
    
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    if(replyTo) {
      await newMessage.populate('replyTo');
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Không thể gửi tin nhắn. Vui lòng thử lại." });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q) return res.status(400).json({ error: "Vui lòng nhập từ khóa tìm kiếm" });

    const messages = await Message.find({
      text: { $regex: q, $options: "i" },
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "username") 
      .populate("receiverId", "username"); 

    res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm tin nhắn:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await message.deleteOne();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only update your own messages" });
    }

    if (!text) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    message.text = text;
    await message.save();

    res.status(200).json({ message: "Message updated successfully", data: message });
  } catch (error) {
    console.error("Error in updateMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.status = "delivered";
    message.deliveredAt = new Date();
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", {
        messageId: message._id,
        deliveredAt: message.deliveredAt
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in markMessageAsDelivered: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.status = "seen";
    message.seenAt = new Date();
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", {
        messageId: message._id,
        seenAt: message.seenAt
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in markMessageAsSeen: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
