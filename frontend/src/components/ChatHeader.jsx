import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { FaThumbtack } from "react-icons/fa";
import { useState, useMemo } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const messages = useChatStore((state) => state.messages);
  const pinnedMessages = useMemo(() => messages.filter(m => m.isPinned), [messages]);

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img 
                src={selectedUser.profilePic || "/avatar.png"} 
                alt={selectedUser.fullName} 
                className="w-full h-full object-cover"
              />
              {onlineUsers.includes(selectedUser._id) && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-1 ring-base-200" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-medium text-base truncate pr-2">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Đang hoạt động" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-circle btn-sm relative"
            title="Xem tin nhắn đã ghim"
            onClick={() => setShowPinnedModal(true)}
          >
            <FaThumbtack className="text-blue-500" />
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-400 text-xs text-white rounded-full px-1.5 py-0.5">
                {pinnedMessages.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setSelectedUser(null)}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {showPinnedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-4 relative">
            <button
              className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
              onClick={() => setShowPinnedModal(false)}
            >
              <X />
            </button>
            <div className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-700">
              <FaThumbtack className="text-blue-500" /> Danh sách tin nhắn đã ghim
            </div>
            {pinnedMessages.length === 0 ? (
              <div className="text-center text-gray-400">Chưa có tin nhắn nào được ghim</div>
            ) : (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {pinnedMessages.map((msg) => (
                  <div key={msg._id} className="p-2 rounded bg-blue-100 border border-blue-200">
                    <div className="text-sm font-medium mb-1">{msg.text || (msg.image ? "[Hình ảnh]" : "[Video]")}</div>
                    <div className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
