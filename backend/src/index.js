import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

// Cấu hình CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Tăng giới hạn payload
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ limit: "40mb", extended: true }));

// Cookie parser
app.use(cookieParser());

// Các route API
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Xử lý static files nếu chạy production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Lắng nghe server
server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
