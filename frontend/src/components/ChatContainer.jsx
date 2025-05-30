import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageInput from "./MessageInput";
import { toast } from "react-hot-toast";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ImageModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full">
        <img
          src={imageUrl}
          alt="Enlarged"
          className="rounded-md max-w-full max-h-screen transform transition duration-300 ease-in-out scale-100 hover:scale-105 filter contrast-125"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="absolute top-2 right-2 bg-gray-800 text-white p-2 rounded-full"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    updateMessage,
    isTyping,
    markMessageAsDelivered,
    markMessageAsSeen,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isBlocking, setIsBlocking] = useState(false); 
  const [isBlockedBy, setIsBlockedBy] = useState(false); 

  const BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://message-chatapp.onrender.com";

  // Kiểm tra trạng thái chặn ban đầu
  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/check`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch block status");
        const user = await response.json();
        const isBlockingOther = user.blockedUsers.includes(selectedUser._id);
        const isBlockedByOther = selectedUser?.blockedUsers?.includes(authUser._id);
        setIsBlocking(isBlockingOther);
        setIsBlockedBy(isBlockedByOther);
      } catch (error) {
        console.error("Error checking block status:", error);
        toast.error("Unable to check block status. Please try again.");
      }
    };

    if (selectedUser) {
      checkBlockStatus();
    }
  }, [selectedUser, authUser._id]);

  useEffect(() => {
    if (socket && selectedUser) {
      const handleUserBlocked = (data) => {
        if (data.blockerId === selectedUser._id) {
          setIsBlockedBy(true);
          toast.error(`Bạn đã bị chặn`);
        }
      };

      const handleUserUnblocked = (data) => {
        if (data.unblockerId === selectedUser._id) {
          setIsBlockedBy(false);
          toast.success(`Bạn có thể nhắn tin`);
        }
      };

      const handleBlockSuccess = (data) => {
        if (data.userId === selectedUser._id) {
          setIsBlocking(true);
          toast.success(`Đã chặn thành công`);
        }
      };

      const handleUnblockSuccess = (data) => {
        if (data.userId === selectedUser._id) {
          setIsBlocking(false);
          toast.success(`Đã bỏ chặn thành công`);
        }
      };

      const handleBlockError = (data) => toast.error(data.message || `Không thể chặn`);
      const handleUnblockError = (data) => toast.error(data.message || `Không thể bỏ chặn`);

      socket.on("userBlocked", handleUserBlocked);
      socket.on("userUnblocked", handleUserUnblocked);
      socket.on("blockSuccess", handleBlockSuccess);
      socket.on("unblockSuccess", handleUnblockSuccess);
      socket.on("blockError", handleBlockError);
      socket.on("unblockError", handleUnblockError);

      return () => {
        socket.off("userBlocked", handleUserBlocked);
        socket.off("userUnblocked", handleUserUnblocked);
        socket.off("blockSuccess", handleBlockSuccess);
        socket.off("unblockSuccess", handleUnblockSuccess);
        socket.off("blockError", handleBlockError);
        socket.off("unblockError", handleUnblockError);
      };
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Xử lý tự động chuyển trạng thái đã nhận sau 5 giây
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.status === "sent" && lastMessage.receiverId === authUser._id) {
        const timer = setTimeout(() => {
          markMessageAsDelivered(lastMessage._id);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, authUser._id, markMessageAsDelivered]);

  // Xử lý chuyển trạng thái đã xem khi click vào input
  const handleInputFocus = () => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.receiverId === authUser._id && msg.status !== "seen"
      );
      unreadMessages.forEach(msg => {
        markMessageAsSeen(msg._id);
      });
    }
  };

  const handleBlockUser = async () => {
    if (!socket) {
      toast.error("Kết nối không khả dụng. Vui lòng thử lại.");
      return;
    }
    try {
      socket.emit("blockUser", { userIdToBlock: selectedUser._id, currentUserId: authUser._id });
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(`Không thể chặn ${selectedUser.name}. Vui lòng thử lại.`);
    }
  };

  const handleUnblockUser = async () => {
    if (!socket) {
      toast.error("Kết nối không khả dụng. Vui lòng thử lại.");
      return;
    }
    try {
      socket.emit("unblockUser", { userIdToUnblock: selectedUser._id, currentUserId: authUser._id });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(`Không thể bỏ chặn. Vui lòng thử lại.`);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message._id);
    setEditText(message.text);
  };

  const handleSaveEdit = async (messageId) => {
    try {
      await updateMessage(messageId, editText.trim());
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error("Không thể cập nhật tin nhắn");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <ChatHeader />
        {isBlocking ? (
          <button
            className="btn btn-sm btn-success"
            onClick={handleUnblockUser}
            disabled={!socket}
          >
            Bỏ chặn
          </button>
        ) : (
          <button
            className="btn btn-sm btn-error"
            onClick={handleBlockUser}
            disabled={!socket || isBlockedBy}
          >
            Chặn
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isBlocking ? (
          <div className="text-center text-gray-500">
            Bạn đã chặn. Vui lòng bỏ chặn để tiếp tục cuộc trò chuyện.
          </div>
        ) : isBlockedBy ? (
          <div className="text-center text-gray-500">
            Bạn đã bị chặn, không thể tiếp tục cuộc trò chuyện.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center justify-end">
                {message.senderId === authUser._id && (
                  <div className="flex gap-2">
                    <button
                      className="text-red-500 text-xs"
                      onClick={() => handleDeleteMessage(message._id)}
                    >
                      <MdDelete />
                    </button>
                    <button
                      className="text-blue-500 text-xs"
                      onClick={() => handleEditMessage(message)}
                    >
                      <MdEdit />
                    </button>
                  </div>
                )}
              </div>
              <div className="chat-bubble flex flex-col">
                {editingMessage === message._id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input input-bordered input-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => handleSaveEdit(message._id)}
                      >
                        Lưu
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={handleCancelEdit}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                        onClick={() => openImageModal(message.image)}
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </>
                )}
              </div>
              <div className="chat-footer text-xs flex gap-2 items-center mt-1.5">
                <time className="ml-1 opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.senderId === authUser._id && (
                  <span className="flex items-center gap-1">
                    {message.status === "sent" && <BsCheck className="text-red-500 font-bold" />}
                    {message.status === "delivered" && (
                      <span className="flex items-center gap-1">
                        <BsCheckAll className="text-red-500 font-bold" />
                        <span className="text-xs text-red-500">Đã nhận</span>
                      </span>
                    )}
                    {message.status === "seen" && (
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200">
                        <img 
                          src={selectedUser.profilePic || "/avatar.png"} 
                          alt="Seen by" 
                          className="w-full h-full object-cover contrast-125"
                        />
                      </div>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {!isBlocking && !isBlockedBy && isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble flex items-center">
              Đang soạn tin nhắn
              <span className="typing-indicator ml-1 inline-block w-1 h-1 rounded-full bg-current animate-pulse"></span>
              <span className="typing-indicator ml-1 inline-block w-1 h-1 rounded-full bg-current animate-pulse delay-200"></span>
              <span className="typing-indicator ml-1 inline-block w-1 h-1 rounded-full bg-current animate-pulse delay-400"></span>
            </div>
          </div>
        )}
      </div>

      {!isBlocking && !isBlockedBy && (
        <div onFocus={handleInputFocus}>
          <MessageInput ref={inputRef} />
        </div>
      )}

      {isModalOpen && (
        <ImageModal
          isOpen={isModalOpen}
          imageUrl={selectedImage}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
};

export default ChatContainer;