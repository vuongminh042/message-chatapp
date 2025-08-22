import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development"
  ? "http://localhost:8000"
  : "https://blink-chat-9wt2.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  blockedByUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Đăng ký thành công");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Đăng nhập thành công");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, blockedByUsers: [], onlineUsers: [] });
      toast.success("Đăng xuất thành công");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.log("Cập nhật thông tin thất bại. Vui lòng thử lại:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("blockSuccess", ({ userId }) => {
      set((state) => ({
        authUser: {
          ...state.authUser,
          blockedUsers: Array.from(
            new Set([...(state.authUser?.blockedUsers || []), userId])
          ),
        },
      }));
    });

    socket.on("unblockSuccess", ({ userId }) => {
      set((state) => ({
        authUser: {
          ...state.authUser,
          blockedUsers: (state.authUser?.blockedUsers || []).filter(
            (id) => id !== userId
          ),
        },
      }));
    });

    socket.on("userBlocked", ({ blockerId }) => {
      set((state) => ({
        blockedByUsers: Array.from(new Set([...(state.blockedByUsers || []), blockerId])),
      }));
    });

    socket.on("userUnblocked", ({ unblockerId }) => {
      set((state) => ({
        blockedByUsers: (state.blockedByUsers || []).filter((id) => id !== unblockerId),
      }));
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
