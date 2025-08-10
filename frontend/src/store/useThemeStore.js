import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  setTheme: (theme, selectedUser = null, socket = null, currentUserId = null, currentUsername = null) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
    
    console.log("Theme changed:", {
      theme,
      selectedUser,
      socket: !!socket,
      currentUserId,
      currentUsername
    });
    
    if (selectedUser && socket && currentUserId) {
      console.log("Sending themeChanged event:", {
        newTheme: theme,
        userId: currentUserId, 
        username: currentUsername || "Người dùng",
        receiverId: selectedUser._id 
      });
      
      socket.emit("themeChanged", {
        newTheme: theme,
        userId: currentUserId, 
        username: currentUsername || "Người dùng", 
        receiverId: selectedUser._id 
      });
    } else if (!selectedUser) {
      console.log("No selectedUser - theme changed locally only");
    } else {
      console.log("Not sending themeChanged event - missing:", {
        selectedUser: !!selectedUser,
        socket: !!socket,
        currentUserId: !!currentUserId
      });
    }
  },
  
  setThemeFromNotification: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
