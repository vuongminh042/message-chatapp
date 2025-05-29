import express from "express";
import { blockUser, checkAuth, login, logout, signup, unblockUser, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.post("/block", protectRoute, blockUser);
router.post("/unblock", protectRoute, unblockUser);

export default router;
