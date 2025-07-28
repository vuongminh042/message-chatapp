import { LogOut, MessageCircle, Settings, User, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import axiosInstance from "../lib/axios";
import { debounce } from "lodash";

const Navbar = ({ handleHighlightMessage }) => {
  const { logout, authUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const fetchSearchResults = debounce(async (query) => {
    if (!query.trim()) return setSearchResults([]);

    try {
      const { data } = await axiosInstance.get(`/messages/search?q=${query}`);
      setSearchResults(data);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm tin nhắn:", error);
    }
  }, 300);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchSearchResults(value);
  };

  const handleSelectMessage = (messageId) => {
    handleHighlightMessage(messageId);
    setSearchResults([]);
    setSearchTerm("");
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 fixed w-full top-0 z-40 backdrop-blur-lg bg-opacity-80">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-all">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/20">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Message Chat</h1>
        </Link>

        <div className="flex items-center gap-6">
          {authUser && (
            <>
              <Link to="/" className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Chat 1-1</span>
              </Link>

              <Link to="/groups" className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Nhóm chat</span>
              </Link>
            </>
          )}

          <Link to={"/settings"} className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Cài đặt</span>
          </Link>

          {authUser && (
            <>
              <Link to={"/profile"} className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Hồ sơ</span>
              </Link>

              <button className="text-gray-300 hover:text-white transition-all flex items-center gap-2" onClick={logout}>
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
