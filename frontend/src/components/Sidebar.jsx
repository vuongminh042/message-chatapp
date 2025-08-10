import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users, X } from "lucide-react";

const Sidebar = ({ isOpen, onToggle }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadMessages } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const searchedUsers = filteredUsers.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside 
      className={`
        h-full border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out
        fixed lg:relative z-50 lg:z-auto bg-base-100
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 lg:w-72 shadow-lg lg:shadow-none
        ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}
        ${isOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}
        ${isOpen ? 'visible' : 'invisible lg:visible'}
        ${isOpen ? 'scale-100' : 'scale-95 lg:scale-100'}
        ${isOpen ? 'backdrop-blur-none' : 'backdrop-blur-sm lg:backdrop-blur-none'}
        ${isOpen ? 'filter-none' : 'filter grayscale lg:filter-none'}
        ${isOpen ? 'rotate-0' : 'rotate-1 lg:rotate-0'}
        ${isOpen ? 'brightness-100' : 'brightness-75 lg:brightness-100'}
        ${isOpen ? 'contrast-100' : 'contrast-75 lg:contrast-100'}
        ${isOpen ? 'saturate-100' : 'saturate-75 lg:saturate-100'}
        ${isOpen ? 'hue-rotate-0' : 'hue-rotate-12 lg:hue-rotate-0'}
      `}
    >
      <div className="border-b border-base-300 w-full p-4 min-w-[256px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium">Liên hệ</span>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-base-300 rounded transition-colors"
            aria-label="Đóng sidebar"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="mt-2 relative">
          <input
            type="text"
            placeholder="Tìm kiếm...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm w-full pr-10 border-y-white border-x-white"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-50" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Hiển thị tài khoản đang hoạt động</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} Hoạt động)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-2 min-w-[256px] flex-1">
        {searchedUsers.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">Không có kết quả phù hợp</div>
        ) : (
          searchedUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className={`
                w-full p-2 flex items-center gap-2
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-10 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}

                {unreadMessages[user._id] > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ring-2 ring-zinc-900">
                    {unreadMessages[user._id]}
                  </span>
                )}
              </div>

              <div className="text-left min-w-0 flex-1">
                <div className={`font-medium truncate ${unreadMessages[user._id] > 0 ? 'text-red-500 font-bold' : ''}`}>
                  {user.fullName}
                  {unreadMessages[user._id] > 0 && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {unreadMessages[user._id]}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Đang hoạt động" : ""}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;