import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://message-chatapp.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  cookie: {
    name: "io",
    path: "/",
    httpOnly: true,
    sameSite: "strict"
  }
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; 

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Thông báo cho tất cả client biết ai đang online
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("typing", () => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.broadcast.emit("typing", userId);
    }
  });

  socket.on("stopTyping", () => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.broadcast.emit("stopTyping", userId);
    }
  });

  socket.on("blockUser", async ({ userIdToBlock, currentUserId }) => {
    try {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { blockedUsers: userIdToBlock } });
      const receiverSocketId = getReceiverSocketId(userIdToBlock);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userBlocked", { blockerId: currentUserId });
      }
      socket.emit("blockSuccess", { userId: userIdToBlock });
    } catch (error) {
      console.error("Error in blockUser socket:", error);
      socket.emit("blockError", { message: "Failed to block user" });
    }
  });

  socket.on("unblockUser", async ({ userIdToUnblock, currentUserId }) => {
    try {
      await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: userIdToUnblock } });
      const receiverSocketId = getReceiverSocketId(userIdToUnblock);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userUnblocked", { unblockerId: currentUserId });
      }
      socket.emit("unblockSuccess", { userId: userIdToUnblock });
    } catch (error) {
      console.error("Error in unblockUser socket:", error);
      socket.emit("unblockError", { message: "Failed to unblock user" });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };