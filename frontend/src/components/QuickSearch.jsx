import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";

const QuickSearch = ({ messages, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setCurrentIndex(-1);
      return;
    }

    const filteredMessages = messages.filter(message => 
      message.text && message.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setResults(filteredMessages);
    setCurrentIndex(filteredMessages.length > 0 ? 0 : -1);
  }, [searchQuery, messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[currentIndex]) {
          scrollToMessage(results[currentIndex]._id);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, currentIndex, results]);

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(messageId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight");
      setTimeout(() => {
        element.classList.remove("highlight");
      }, 2000);
    }
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-black px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-base-100 rounded-lg shadow-xl border border-base-300 w-80">
      <div className="p-3 border-b border-base-300">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm trong cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm flex-1"
          />
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {searchQuery.trim() && (
        <div className="max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-3 text-center text-sm text-base-content/70">
              Không tìm thấy kết quả
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-base-content/50 mb-2">
                {results.length} kết quả
              </div>
              {results.map((message, index) => (
                <div
                  key={message._id}
                  onClick={() => scrollToMessage(message._id)}
                  className={`p-2 rounded cursor-pointer text-sm transition-colors ${
                    index === currentIndex 
                      ? 'bg-primary text-primary-content' 
                      : 'hover:bg-base-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </span>
                    {index === currentIndex && (
                      <div className="flex items-center gap-1 text-xs">
                        <ArrowUp className="w-3 h-3" />
                        <ArrowDown className="w-3 h-3" />
                        Enter
                      </div>
                    )}
                  </div>
                  <div className="line-clamp-2">
                    {highlightText(message.text, searchQuery)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-2 border-t border-base-300 bg-base-200/50">
        <div className="text-xs text-base-content/70">
          ⌨️ ↑↓ để di chuyển, Enter để chọn, Esc để đóng
        </div>
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
      `}</style>
    </div>
  );
};

export default QuickSearch;
