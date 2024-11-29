import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { MdDeleteForever } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";

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
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
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
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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
            <div className="chat-header mb-1 flex items-center justify-between">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.senderId === authUser._id && (
                <div className="flex gap-2">
                  <button
                    className="text-red-500 text-xs"
                    onClick={() => handleDeleteMessage(message._id)}
                  >
                    <MdDeleteForever />
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
                      <FaSave />
                    </button>
                    <button
                      className="btn btn-xs btn-light"
                      onClick={handleCancelEdit}
                    >
                      <FcCancel className="text-white" />
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
          </div>
        ))}
      </div>

      <MessageInput />

      {/* Modal để hiển thị ảnh */}
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
