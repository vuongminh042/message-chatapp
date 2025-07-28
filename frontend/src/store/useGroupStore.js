import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  // Lấy danh sách nhóm của user
  getUserGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      console.error("Error in getUserGroups:", error);
      toast.error(error.response?.data?.error || "Không thể tải danh sách nhóm");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Tạo nhóm mới
  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({ groups: [res.data, ...state.groups] }));
      toast.success("Tạo nhóm thành công!");
      return res.data;
    } catch (error) {
      console.error("Error in createGroup:", error);
      toast.error(error.response?.data?.error || "Không thể tạo nhóm");
      throw error;
    }
  },

  // Chọn nhóm để chat
  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
    if (group) {
      get().getGroupMessages(group._id);
    }
  },

  // Lấy tin nhắn trong nhóm
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      console.error("Error in getGroupMessages:", error);
      toast.error(error.response?.data?.error || "Không thể tải tin nhắn nhóm");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Gửi tin nhắn trong nhóm
  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      set((state) => ({
        groupMessages: [...state.groupMessages, res.data],
      }));
      
      // Cập nhật lastMessage của nhóm trong danh sách
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId
            ? { ...group, lastMessage: res.data, lastActivity: new Date() }
            : group
        ),
      }));
    } catch (error) {
      console.error("Error in sendGroupMessage:", error);
      toast.error(error.response?.data?.error || "Không thể gửi tin nhắn");
      throw error;
    }
  },

  // Thêm thành viên vào nhóm
  addMemberToGroup: async (groupId, userIds) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { userIds });
      
      // Cập nhật thông tin nhóm
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data.group : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
      
      toast.success(res.data.message);
      return res.data.group;
    } catch (error) {
      console.error("Error in addMemberToGroup:", error);
      toast.error(error.response?.data?.error || "Không thể thêm thành viên");
      throw error;
    }
  },

  // Rời khỏi nhóm
  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
      }));
      
      toast.success("Đã rời khỏi nhóm thành công");
    } catch (error) {
      console.error("Error in leaveGroup:", error);
      toast.error(error.response?.data?.error || "Không thể rời khỏi nhóm");
      throw error;
    }
  },

  // Xóa thành viên khỏi nhóm
  removeMemberFromGroup: async (groupId, userId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      
      // Cập nhật danh sách thành viên trong nhóm
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId
            ? {
                ...group,
                members: group.members.filter((member) => member.user._id !== userId),
              }
            : group
        ),
        selectedGroup:
          state.selectedGroup?._id === groupId
            ? {
                ...state.selectedGroup,
                members: state.selectedGroup.members.filter(
                  (member) => member.user._id !== userId
                ),
              }
            : state.selectedGroup,
      }));
      
      toast.success("Xóa thành viên thành công");
    } catch (error) {
      console.error("Error in removeMemberFromGroup:", error);
      toast.error(error.response?.data?.error || "Không thể xóa thành viên");
      throw error;
    }
  },

  // Cập nhật thông tin nhóm
  updateGroup: async (groupId, updateData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, updateData);
      
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data.group : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
      
      toast.success(res.data.message);
      return res.data.group;
    } catch (error) {
      console.error("Error in updateGroup:", error);
      toast.error(error.response?.data?.error || "Không thể cập nhật nhóm");
      throw error;
    }
  },

  // Tìm kiếm nhóm công khai
  searchPublicGroups: async (query) => {
    try {
      const res = await axiosInstance.get(`/groups/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      console.error("Error in searchPublicGroups:", error);
      toast.error(error.response?.data?.error || "Không thể tìm kiếm nhóm");
      return [];
    }
  },

  // Tham gia nhóm công khai
  joinPublicGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/join`);
      
      set((state) => ({
        groups: [res.data.group, ...state.groups],
      }));
      
      toast.success(res.data.message);
      return res.data.group;
    } catch (error) {
      console.error("Error in joinPublicGroup:", error);
      toast.error(error.response?.data?.error || "Không thể tham gia nhóm");
      throw error;
    }
  },

  // Lấy chi tiết nhóm
  getGroupDetails: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/groups/${groupId}`);
      return res.data;
    } catch (error) {
      console.error("Error in getGroupDetails:", error);
      toast.error(error.response?.data?.error || "Không thể tải thông tin nhóm");
      throw error;
    }
  },

  // Xử lý tin nhắn nhóm mới từ socket
  addGroupMessage: (message) => {
    const { selectedGroup } = get();
    
    if (selectedGroup && message.groupId === selectedGroup._id) {
      set((state) => ({
        groupMessages: [...state.groupMessages, message],
      }));
    }
    
    // Cập nhật lastMessage trong danh sách nhóm
    set((state) => ({
      groups: state.groups.map((group) =>
        group._id === message.groupId
          ? { ...group, lastMessage: message, lastActivity: new Date() }
          : group
      ),
    }));
  },

  // Xử lý khi được thêm vào nhóm mới
  handleAddedToGroup: (group) => {
    set((state) => ({
      groups: [group, ...state.groups],
    }));
    toast.success(`Bạn đã được thêm vào nhóm "${group.name}"`);
  },

  // Xử lý khi có thành viên mới tham gia
  handleNewMemberJoined: (data) => {
    const { groupId, newMember } = data;
    set((state) => ({
      groups: state.groups.map((group) =>
        group._id === groupId
          ? {
              ...group,
              members: [...group.members, { user: newMember, role: "member", joinedAt: new Date() }],
            }
          : group
      ),
      selectedGroup:
        state.selectedGroup?._id === groupId
          ? {
              ...state.selectedGroup,
              members: [
                ...state.selectedGroup.members,
                { user: newMember, role: "member", joinedAt: new Date() },
              ],
            }
          : state.selectedGroup,
    }));
  },

  // Xử lý khi thành viên rời nhóm
  handleMemberLeftGroup: (data) => {
    const { groupId, userId, newAdmin } = data;
    set((state) => ({
      groups: state.groups.map((group) =>
        group._id === groupId
          ? {
              ...group,
              members: group.members.filter((member) => member.user._id !== userId),
              admin: newAdmin || group.admin,
            }
          : group
      ),
      selectedGroup:
        state.selectedGroup?._id === groupId
          ? {
              ...state.selectedGroup,
              members: state.selectedGroup.members.filter(
                (member) => member.user._id !== userId
              ),
              admin: newAdmin || state.selectedGroup.admin,
            }
          : state.selectedGroup,
    }));
  },

  // Xử lý khi bị xóa khỏi nhóm
  handleRemovedFromGroup: (data) => {
    const { groupId } = data;
    set((state) => ({
      groups: state.groups.filter((group) => group._id !== groupId),
      selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
    }));
    toast.error(`Bạn đã bị xóa khỏi nhóm "${data.groupName}"`);
  },

  // Xử lý khi nhóm được cập nhật
  handleGroupUpdated: (updatedGroup) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group._id === updatedGroup._id ? updatedGroup : group
      ),
      selectedGroup:
        state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup,
    }));
  },

  // Reset store
  clearGroupStore: () => {
    set({
      groups: [],
      selectedGroup: null,
      groupMessages: [],
      isGroupsLoading: false,
      isGroupMessagesLoading: false,
    });
  },
}));