import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? "https://blink-chat-9wt2.onrender.com"
      : "http://localhost:5173",
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

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

  socket.on("messageUpdated", (updatedMessage) => {
    socket.broadcast.emit("messageUpdated", updatedMessage);
  });

  socket.on("messageDeleted", ({ messageId }) => {
    socket.broadcast.emit("messageDeleted", { messageId });
  });

  socket.on("blockUser", async ({ userIdToBlock, currentUserId }) => {
    try {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { blockedUsers: userIdToBlock } });
      socket.broadcast.to(userIdToBlock).emit("userBlocked", { blockerId: currentUserId });
      socket.emit("blockSuccess", { userId: userIdToBlock });
    } catch (error) {
      console.error("Error in blockUser socket:", error);
      socket.emit("blockError", { message: "Failed to block user" });
    }
  });

  socket.on("unblockUser", async ({ userIdToUnblock, currentUserId }) => {
    try {
      await User.findByIdAndUpdate(currentUserId, { $pull: { blockedUsers: userIdToUnblock } });
      socket.broadcast.to(userIdToUnblock).emit("userUnblocked", { unblockerId: currentUserId });
      socket.emit("unblockSuccess", { userId: userIdToUnblock });
    } catch (error) {
      console.error("Error in unblockUser socket:", error);
      socket.emit("unblockError", { message: "Failed to unblock user" });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

});

export { io, app, server };