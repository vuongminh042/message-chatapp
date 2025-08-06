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
import { Reply } from "lucide-react";
import { FaThumbtack } from "react-icons/fa";

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
    pinUnpinMessage,
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
  const [replyTo, setReplyTo] = useState(null);

  const BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:8000"
    : "https://blink-chat-9wt2.onrender.com";

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

  const handleReplyMessage = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const convertUrlsToLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-200 underline"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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

  const pinnedMessages = messages.filter(m => m.isPinned);
  const normalMessages = messages.filter(m => !m.isPinned);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex justify-between items-center p-2 sm:p-4 border-b">
        <ChatHeader />
        {isBlocking ? (
          <button
            className="btn btn-xs sm:btn-sm btn-success text-white"
            onClick={handleUnblockUser}
            disabled={!socket}
          >
            Bỏ chặn
          </button>
        ) : (
          <button
            className="btn btn-xs sm:btn-sm btn-error text-white"
            onClick={handleBlockUser}
            disabled={!socket || isBlockedBy}
          >
            Chặn
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {isBlocking ? (
          <div className="text-center text-gray-500">
            Bạn đã chặn. Vui lòng bỏ chặn để tiếp tục cuộc trò chuyện.
          </div>
        ) : isBlockedBy ? (
          <div className="text-center text-gray-500">
            Bạn đã bị chặn, không thể tiếp tục cuộc trò chuyện.
          </div>
        ) : (
          <>
            {pinnedMessages.length > 0 && (
              <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
                <div className="font-semibold text-blue-700 mb-1 sm:mb-2 flex items-center gap-2 text-base sm:text-lg">
                  <FaThumbtack className="text-blue-500 text-base sm:text-lg" /> Tin nhắn đã ghim
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {pinnedMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"} group relative`}
                    >
                      <div className="chat-header mb-0.5 sm:mb-1 flex items-center justify-end">
                        <button
                          className={`ml-1 sm:ml-2 text-xs sm:text-sm ${message.isPinned ? "text-blue-500" : "text-gray-400"}`}
                          title={message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                          onClick={() => pinUnpinMessage(message._id)}
                        >
                          <FaThumbtack style={{ transform: message.isPinned ? "rotate(-45deg)" : "none" }} className="text-base sm:text-lg" />
                        </button>
                      </div>
                      <div className="chat-bubble flex flex-col min-w-0 bg-blue-100 border border-blue-200 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-base">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="max-w-[120px] sm:max-w-[200px] rounded-md mb-1 sm:mb-2 cursor-pointer"
                            onClick={() => openImageModal(message.image)}
                          />
                        )}
                        {message.video && (
                          <div className="video-wrapper">
                            <video
                              src={message.video}
                              controls
                              preload="none"
                              className="w-[80px] sm:w-[320px] rounded-md mb-1 sm:mb-2"
                              poster="/video-thumbnail.png"
                            />
                          </div>
                        )}
                        {message.text && (
                          <p className="whitespace-pre-wrap break-words text-black text-xs sm:text-base">
                            {convertUrlsToLinks(message.text)}
                          </p>
                        )}
                      </div>
                      <div className="chat-footer text-[10px] sm:text-xs flex gap-1 sm:gap-2 items-center mt-0.5 sm:mt-1.5">
                        <time className="ml-1 opacity-50">
                          {formatMessageTime(message.createdAt)}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {normalMessages.map((message, idx) => (
              <div
                key={message._id}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"} group`}
                ref={idx === normalMessages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full border">
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
                  <button
                    className={`ml-2 text-xs ${message.isPinned ? "text-yellow-500" : "text-gray-400"}`}
                    title={message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                    onClick={() => pinUnpinMessage(message._id)}
                  >
                    <FaThumbtack style={{ transform: message.isPinned ? "rotate(-45deg)" : "none" }} />
                  </button>
                </div>
                <div className="relative">
                  {message.replyTo && (
                    <div
                      className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-base-200 mb-1 cursor-pointer hover:bg-base-300 transition-colors max-w-[200px] ${message.senderId === authUser._id ? "ml-auto" : "mr-auto"
                        }`}
                      onClick={() => {
                        const replyMessage = messages.find(m => m._id === message.replyTo._id);
                        if (replyMessage) {
                          const element = document.getElementById(replyMessage._id);
                          element?.scrollIntoView({ behavior: "smooth", block: "center" });
                          element?.classList.add("highlight");
                          setTimeout(() => element?.classList.remove("highlight"), 2000);
                        }
                      }}
                    >
                      <Reply size={12} />
                      <div className="flex-1 truncate">
                        <span className="opacity-70">
                          {message.replyTo.senderId === authUser._id ? "You" : selectedUser.username}
                        </span>
                        <p className="truncate">{message.replyTo.text || "Image message"}</p>
                      </div>
                    </div>
                  )}
                  <div id={message._id} className="chat-bubble flex flex-col min-w-0">
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
                        {message.video && (
                          <div className="video-wrapper">
                            <video
                              src={message.video}
                              controls
                              preload="none"
                              className="w-[100px] sm:w-[320px] rounded-md mb-2"
                              poster="/video-thumbnail.png"
                            />
                          </div>
                        )}
                        {message.text && (
                          <p className="whitespace-pre-wrap break-words">
                            {convertUrlsToLinks(message.text)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-xs btn-circle"
                    onClick={() => handleReplyMessage(message)}
                    style={{
                      [message.senderId === authUser._id ? "left" : "right"]: "-24px"
                    }}
                  >
                    <Reply size={14} />
                  </button>
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
            ))}
          </>
        )}
        {!isBlocking && !isBlockedBy && isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble flex items-center text-xs sm:text-sm">
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
          <MessageInput
            ref={inputRef}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
          />
        </div>
      )}

      {isModalOpen && (
        <ImageModal
          isOpen={isModalOpen}
          imageUrl={selectedImage}
          onClose={closeImageModal}
        />
      )}

      <style>
        {`
          .chat-bubble {
            display: inline-block !important;
            max-width: max-content !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.875rem;
          }
          @media (min-width: 640px) {
            .chat-bubble {
              padding: 0.75rem 1rem !important;
              font-size: 1rem;
            }
          }
          .highlight {
            animation: highlight 2s ease-in-out;
          }
          @keyframes highlight {
            0%, 100% {
              background-color: inherit;
            }
            50% {
              background-color: hsl(var(--p) / 0.2);
            }
          }
          .video-wrapper {
            position: relative;
            width: fit-content;
          }
          video {
            max-height: 80px;
            background: #000;
          }
          @media (min-width: 640px) {
            video {
              max-height: 300px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatContainer;