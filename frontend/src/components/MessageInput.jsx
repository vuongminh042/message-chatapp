import { useRef, useState, useEffect, forwardRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Plus, Smile, Reply } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useAuthStore } from "../store/useAuthStore";

// Định nghĩa styles
const styles = {
  fadeIn: {
    animation: 'fadeIn 0.2s ease-in-out',
  }
};

const MessageInput = forwardRef(({ replyTo, onCancelReply }, ref) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { sendMessage } = useChatStore();
  const { socket } = useAuthStore();

  useEffect(() => {
    if (text) {
      socket.emit("typing");
    } else {
      socket.emit("stopTyping");
    }
  }, [text, socket]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setShowPlusMenu(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        replyTo: replyTo?._id,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket.emit("stopTyping");
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiClick = (emoji) => {
    setText((prevText) => prevText + emoji.emoji);
  };

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPlusMenu) {
        const isClickInsideMenu = event.target.closest('.menu-container');
        if (!isClickInsideMenu) {
          setShowPlusMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu]);

  return (
    <div className="p-4 w-full">
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {replyTo && (
        <div className="mb-3 flex items-center gap-2 bg-base-200 p-2 rounded-lg">
          <Reply size={16} />
          <div className="flex-1">
            <p className="text-sm opacity-70">Replying to message</p>
            <p className="text-sm truncate">{replyTo.text || "Image message"}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative menu-container">
            <button
              type="button"
              className="btn btn-circle btn-sm h-10 w-10 min-h-10"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
            >
              <Plus size={20} />
            </button>
            
            {showPlusMenu && (
              <div 
                className="absolute bottom-full left-0 mb-2 bg-base-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50"
                style={styles.fadeIn}
              >
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost justify-start gap-2"
                    onClick={() => {
                      setShowEmojiPicker(true);
                      setShowPlusMenu(false);
                    }}
                  >
                    <Smile size={18} />
                    <span>Chọn emoji</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost justify-start gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image size={18} />
                    <span>Gửi hình ảnh</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm h-10"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            ref={ref}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-circle btn-sm h-10 w-10 min-h-10"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={20} />
        </button>

        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-2 z-50 w-full lg:w-auto"
            style={styles.fadeIn}
          >
            <div className="relative bg-base-200 rounded-lg p-2">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute -top-1 -right-1 btn btn-circle btn-xs"
              >
                <X size={14} />
              </button>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={400}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;