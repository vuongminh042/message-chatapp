import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import GroupChatHeader from "./GroupChatHeader";
import GroupMessageInput from "./GroupMessageInput";
import { formatMessageTime } from "../lib/utils";

const GroupChatContainer = () => {
  const messagesEndRef = useRef(null);
  const { 
    selectedGroup, 
    groupMessages, 
    isGroupMessagesLoading 
  } = useGroupStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (messagesEndRef.current && groupMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">Chọn một nhóm để bắt đầu chat</h3>
          <p className="text-base-content/60">
            Chọn nhóm từ danh sách bên trái để bắt đầu cuộc trò chuyện
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <GroupChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGroupMessagesLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : groupMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-base-content/60">
                Chưa có tin nhắn nào trong nhóm này
              </p>
            </div>
          </div>
        ) : (
          groupMessages.map((message, index) => {
            const isOwnMessage = message.senderId._id === authUser._id;
            const showSenderInfo = !isOwnMessage && (
              index === 0 || 
              groupMessages[index - 1].senderId._id !== message.senderId._id
            );

            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-end space-x-2`}>
                  {/* Avatar for others' messages */}
                  {!isOwnMessage && (
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img
                          src={message.senderId.profilePic || "/avatar.png"}
                          alt={message.senderId.fullName}
                        />
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                    {/* Sender name for others' messages */}
                    {showSenderInfo && (
                      <span className="text-xs text-base-content/60 mb-1 px-2">
                        {message.senderId.fullName}
                      </span>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-lg p-3 max-w-xs break-words ${
                        isOwnMessage
                          ? "bg-primary text-primary-content"
                          : "bg-base-200"
                      }`}
                    >
                      {/* Reply to message */}
                      {message.replyTo && (
                        <div className="mb-2 p-2 border-l-2 border-current opacity-70 text-sm">
                          <div className="font-medium">
                            {message.replyTo.senderId?.fullName || "Người dùng"}
                          </div>
                          <div className="truncate">
                            {message.replyTo.text || 
                             (message.replyTo.image && "📷 Hình ảnh") ||
                             (message.replyTo.video && "🎥 Video")}
                          </div>
                        </div>
                      )}

                      {/* Message content */}
                      {message.image && (
                        <div className="mb-2">
                          <img
                            src={message.image}
                            alt="Hình ảnh"
                            className="rounded max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(message.image, '_blank')}
                          />
                        </div>
                      )}

                      {message.video && (
                        <div className="mb-2">
                          <video
                            src={message.video}
                            controls
                            className="rounded max-w-full h-auto"
                          />
                        </div>
                      )}

                      {message.text && (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.text}
                        </p>
                      )}

                      {/* Message time */}
                      <div className={`text-xs mt-1 ${isOwnMessage ? "text-primary-content/70" : "text-base-content/50"}`}>
                        {formatMessageTime(message.createdAt)}
                        {isOwnMessage && message.status && (
                          <span className="ml-1">
                            {message.status === "sent" && "✓"}
                            {message.status === "delivered" && "✓✓"}
                            {message.status === "seen" && "✓✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;