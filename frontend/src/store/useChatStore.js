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
  unreadMessages: {}, 

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
      
      // Emit socket event để thông báo tin nhắn đã bị xóa
      const socket = useAuthStore.getState().socket;
      socket.emit("messageDeleted", { messageId });
      
      toast.success("Xóa tin nhắn thành công!");
    } catch (error) {
      toast.error(error.response.data.message || "Không thể xóa tin nhắn. Vui lòng thử lại.");
    }
  },

  updateMessage: async (messageId, newText) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text: newText });
      const updatedMessage = { ...messages.find(m => m._id === messageId), text: res.data.text };
      
      // Cập nhật tin nhắn trong danh sách
      set({
        messages: messages.map((message) =>
          message._id === messageId ? updatedMessage : message
        ),
      });

      const socket = useAuthStore.getState().socket;
      socket.emit("messageUpdated", updatedMessage);
      
      toast.success("Cập nhật tin nhắn thành công!");
    } catch (error) {
      toast.error(error.response.data.message || "Không thể cập nhật tin nhắn. Vui lòng thử lại.");
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
      console.error("Không thể xác nhận đã gửi tin nhắn. Vui lòng thử lại.", error);
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
      console.error("Không thể cập nhật trạng thái đã xem cho tin nhắn.", error);
    }
  },

  pinUnpinMessage: async (messageId) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/pin`);
      const updatedMessage = res.data.data;
      set({
        messages: messages.map((message) =>
          message._id === messageId ? updatedMessage : message
        ),
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Không thể ghim/bỏ ghim tin nhắn");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      
      // Nếu tin nhắn đến từ người đang chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({
          messages: [...messages, newMessage],
        });
        get().markMessageAsDelivered(newMessage._id);
      }

      if (!selectedUser || newMessage.senderId !== selectedUser._id) {
        set(state => ({
          unreadMessages: {
            ...state.unreadMessages,
            [newMessage.senderId]: (state.unreadMessages[newMessage.senderId] || 0) + 1
          }
        }));
      }
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

    socket.on("messageUpdated", (updatedMessage) => {
      const { messages } = get();
      set({
        messages: messages.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message
        ),
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      const { messages } = get();
      set({
        messages: messages.filter((message) => message._id !== messageId),
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
    socket.off("messageUpdated"); 
    socket.off("messageDeleted"); 
    socket.off("typing");
    socket.off("stopTyping");
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if (user) {
      set(state => ({
        unreadMessages: {
          ...state.unreadMessages,
          [user._id]: 0
        }
      }));
    }
  },

}));