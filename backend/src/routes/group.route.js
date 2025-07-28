import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  sendGroupMessage,
  getGroupMessages,
  addMemberToGroup,
  leaveGroup,
  removeMemberFromGroup,
  updateGroup,
  searchPublicGroups,
  joinPublicGroup
} from "../controllers/group.controller.js";

const router = express.Router();

// Tạo nhóm mới
router.post("/create", protectRoute, createGroup);

// Lấy danh sách nhóm của user
router.get("/", protectRoute, getUserGroups);

// Tìm kiếm nhóm công khai
router.get("/search", protectRoute, searchPublicGroups);

// Lấy thông tin chi tiết nhóm
router.get("/:groupId", protectRoute, getGroupDetails);

// Gửi tin nhắn trong nhóm
router.post("/:groupId/messages", protectRoute, sendGroupMessage);

// Lấy tin nhắn trong nhóm
router.get("/:groupId/messages", protectRoute, getGroupMessages);

// Thêm thành viên vào nhóm
router.post("/:groupId/members", protectRoute, addMemberToGroup);

// Rời khỏi nhóm
router.delete("/:groupId/leave", protectRoute, leaveGroup);

// Xóa thành viên khỏi nhóm (chỉ admin)
router.delete("/:groupId/members/:userId", protectRoute, removeMemberFromGroup);

// Cập nhật thông tin nhóm
router.put("/:groupId", protectRoute, updateGroup);

// Tham gia nhóm công khai
router.post("/:groupId/join", protectRoute, joinPublicGroup);

export default router;