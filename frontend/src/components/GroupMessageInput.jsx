import { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { Image, Send, Video, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";

const GroupMessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const { selectedGroup, sendGroupMessage } = useGroupStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video hợp lệ");
      return;
    }

    if (file.size > 1024 * 1024 * 1024) { // 1GB
      toast.error("Kích thước video không được vượt quá 1GB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setVideoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !imagePreview && !videoPreview) return;

    try {
      await sendGroupMessage(selectedGroup._id, {
        text: text.trim(),
        image: imagePreview,
        video: videoPreview,
        replyTo: replyTo?._id
      });

      // Reset form
      setText("");
      setImagePreview(null);
      setVideoPreview(null);
      setReplyTo(null);
      setShowEmojiPicker(false);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  };

  if (!selectedGroup) return null;

  return (
    <div className="p-4 border-t border-base-300">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-3 p-2 bg-base-200 rounded-lg border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-base-content/60">
                Trả lời {replyTo.senderId?.fullName || "Người dùng"}
              </p>
              <p className="text-sm truncate">
                {replyTo.text || 
                 (replyTo.image && "📷 Hình ảnh") ||
                 (replyTo.video && "🎥 Video")}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="btn btn-ghost btn-xs btn-circle"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-40 rounded-lg object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/50 border-none text-white hover:bg-black/70"
          >
            ×
          </button>
        </div>
      )}

      {/* Video preview */}
      {videoPreview && (
        <div className="mb-3 relative">
          <video
            src={videoPreview}
            className="max-h-40 rounded-lg"
            controls
          />
          <button
            onClick={removeVideo}
            className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/50 border-none text-white hover:bg-black/70"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
        {/* Media buttons */}
        <div className="flex space-x-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => fileInputRef.current?.click()}
            title="Gửi hình ảnh"
          >
            <Image size={18} />
          </button>

          <input
            type="file"
            accept="video/*"
            className="hidden"
            ref={videoInputRef}
            onChange={handleVideoChange}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => videoInputRef.current?.click()}
            title="Gửi video"
          >
            <Video size={18} />
          </button>

          {/* Emoji picker */}
          <div className="relative">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Chọn emoji"
            >
              <Smile size={18} />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="auto"
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>

        {/* Text input */}
        <div className="flex-1">
          <textarea
            className="textarea textarea-bordered w-full resize-none"
            placeholder="Nhập tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
            style={{
              minHeight: "2.5rem",
              maxHeight: "8rem",
              height: "auto",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          className="btn btn-primary btn-circle"
          disabled={!text.trim() && !imagePreview && !videoPreview}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput;