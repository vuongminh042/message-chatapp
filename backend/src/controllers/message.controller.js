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
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
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
    })
    .sort({ createdAt: 1 })

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
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
        const base64Size = video.length * 0.75;
        const videoSize = base64Size - (video.split(',')[0].length + 1);
        const maxSize = 1024 * 1024 * 1024; 

        if (videoSize > maxSize) {
          return res.status(400).json({
            error: "Kích thước video không được vượt quá 1GB"
          });
        }

        const uploadResponse = await cloudinary.uploader.upload(video, {
          resource_type: "video",
          chunk_size: 20000000,
          eager: [
            { 
              format: "mp4",
              transformation: [
                { width: 380, crop: "scale" },
                { quality: "auto:eco" }
              ]
            }
          ],
          eager_async: true,
          allowed_formats: ["mp4", "mov", "avi", "mkv"],
          max_file_size: 1024000000 
        });
        videoUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading video:", uploadError);
        return res.status(400).json({ 
          error: "Không thể tải lên video. Video phải có định dạng MP4, MOV, AVI hoặc MKV và dung lượng dưới 1GB." 
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
      .populate("senderId", "fullName username") 
      .populate("receiverId", "fullName username")
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm tin nhắn:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Bạn không thể xóa tin nhắn của người khác." });
    }

    await message.deleteOne();

    res.status(200).json({ message: "Xóa tin nhắn thành công" });
  } catch (error) {
    console.error("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Không thể chỉnh sửa tin nhắn của người khác." });
    }

    if (!text) {
      return res.status(400).json({ error: "Vui lòng nhập nội dung tin nhắn trước khi gửi." });
    }

    message.text = text;
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (senderSocketId) io.to(senderSocketId).emit("messageUpdated", message);
    if (receiverSocketId) io.to(receiverSocketId).emit("messageUpdated", message);

    res.status(200).json({ message: "Cập nhật tin nhắn thành công!", data: message });
  } catch (error) {
    console.error("Error in updateMessage: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const markMessageAsDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
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
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
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
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const pinUnpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    }
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ error: "Không có quyền ghim/bỏ ghim tin nhắn này." });
    }
    message.isPinned = !message.isPinned;
    await message.save();
    res.status(200).json({ message: message.isPinned ? "Đã ghim tin nhắn" : "Đã bỏ ghim tin nhắn", data: message });
  } catch (error) {
    console.error("Error in pinUnpinMessage: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ error: "Thiếu emoji" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();
    if (!isParticipant) return res.status(403).json({ error: "Không có quyền phản ứng tin nhắn này" });

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex >= 0) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1); 
      } else {
        message.reactions[existingIndex].emoji = emoji; 
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const payload = { _id: message._id, reactions: message.reactions };

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (senderSocketId) io.to(senderSocketId).emit("messageReaction", payload);
    if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", payload);

    res.status(200).json(payload);
  } catch (error) {
    console.error("Error in reactToMessage:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};