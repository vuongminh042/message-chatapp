import { create } from "zustand";
import toast from "react-hot-toast";

import { useAuthStore } from "./useAuthStore";
import axiosInstance from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, { ...res.data, status: "sent" }] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      // Cập nhật danh sách tin nhắn sau khi xóa
      set({ messages: messages.filter((message) => message._id !== messageId) });
      toast.success("Message deleted successfully!");
    } catch (error) {
      toast.error(error.response.data.message || "Failed to delete message.");
    }
  },

  updateMessage: async (messageId, newText) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text: newText });
      // Cập nhật tin nhắn trong danh sách
      set({
        messages: messages.map((message) =>
          message._id === messageId ? { ...message, text: res.data.text } : message
        ),
      });
      toast.success("Message updated successfully!");
    } catch (error) {
      toast.error(error.response.data.message || "Failed to update message.");
    }
  },

  markMessageAsDelivered: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/deliver`);
      const { messages } = get();
      set({
        messages: messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "delivered", deliveredAt: res.data.deliveredAt }
            : message
        ),
      });
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  },

  markMessageAsSeen: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/seen`);
      const { messages } = get();
      set({
        messages: messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "seen", seenAt: res.data.seenAt }
            : message
        ),
      });
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });

      // Mark message as delivered when received
      get().markMessageAsDelivered(newMessage._id);
    });

    socket.on("messageDelivered", ({ messageId, deliveredAt }) => {
      const { messages } = get();
      set({
        messages: messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "delivered", deliveredAt }
            : message
        ),
      });
    });

    socket.on("messageSeen", ({ messageId, seenAt }) => {
      const { messages } = get();
      set({
        messages: messages.map((message) =>
          message._id === messageId
            ? { ...message, status: "seen", seenAt }
            : message
        ),
      });
    });

    socket.on("typing", (typingUserId) => {
      if (typingUserId === selectedUser._id) {
        set({ isTyping: true });
      }
    });

    socket.on("stopTyping", (typingUserId) => {
      if (typingUserId === selectedUser._id) {
        set({ isTyping: false });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDelivered");
    socket.off("messageSeen");
    socket.off("typing");
    socket.off("stopTyping");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

}));