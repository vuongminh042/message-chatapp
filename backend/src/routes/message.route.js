import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { deleteMessage, getMessages, getUsersForSidebar, markMessageAsDelivered, markMessageAsSeen, searchMessages, sendMessage, updateMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search", protectRoute, searchMessages);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.put("/:id", protectRoute, updateMessage);

router.put("/:messageId/deliver", protectRoute, markMessageAsDelivered);
router.put("/:messageId/seen", protectRoute, markMessageAsSeen);

export default router;
