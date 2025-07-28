import { useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import GroupSidebar from "../components/GroupSidebar";
import GroupChatContainer from "../components/GroupChatContainer";

const GroupChatPage = () => {
  const { authUser } = useAuthStore();
  const { getUsersForSidebar } = useChatStore();
  const { 
    getUserGroups,
    addGroupMessage,
    handleAddedToGroup,
    handleNewMemberJoined,
    handleMemberLeftGroup,
    handleRemovedFromGroup,
    handleGroupUpdated
  } = useGroupStore();

  useEffect(() => {
    if (authUser) {
      getUserGroups();
      getUsersForSidebar();
    }
  }, [authUser, getUserGroups, getUsersForSidebar]);

  useEffect(() => {
    const { socket } = useAuthStore.getState();
    
    if (socket) {
      // Lắng nghe tin nhắn nhóm mới
      socket.on("newGroupMessage", addGroupMessage);
      
      // Lắng nghe sự kiện nhóm
      socket.on("addedToGroup", handleAddedToGroup);
      socket.on("newMemberJoined", handleNewMemberJoined);
      socket.on("memberLeftGroup", handleMemberLeftGroup);
      socket.on("removedFromGroup", handleRemovedFromGroup);
      socket.on("groupUpdated", handleGroupUpdated);

      return () => {
        socket.off("newGroupMessage");
        socket.off("addedToGroup");
        socket.off("newMemberJoined");
        socket.off("memberLeftGroup");
        socket.off("removedFromGroup");
        socket.off("groupUpdated");
      };
    }
  }, [
    addGroupMessage,
    handleAddedToGroup,
    handleNewMemberJoined,
    handleMemberLeftGroup,
    handleRemovedFromGroup,
    handleGroupUpdated
  ]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <GroupSidebar />
            <GroupChatContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage;