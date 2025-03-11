import { LogOut, MessageCircle, Settings, User, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
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

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search for messages...."
            className="input input-sm bg-gray-800 text-white placeholder-gray-400 input-bordered w-full px-3 rounded-md focus:outline-none"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />

          {searchResults.length > 0 && (
            <ul className="absolute bg-gray-900 shadow-lg p-2 mt-1 rounded w-full max-h-60 overflow-y-auto border border-gray-700">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="p-2 border-b border-gray-700 last:border-none flex items-center gap-2 cursor-pointer hover:bg-gray-800 text-white"
                  onClick={() => handleSelectMessage(result.id)}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{result.senderName}:</span>
                  <span>{result.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-6">
          <Link to={"/settings"} className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {authUser && (
            <>
              <Link to={"/profile"} className="text-gray-300 hover:text-white transition-all flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>

              <button className="text-gray-300 hover:text-white transition-all flex items-center gap-2" onClick={logout}>
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
