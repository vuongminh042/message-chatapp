import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Plus, Search, Crown, Shield } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const GroupSidebar = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { 
    groups, 
    selectedGroup, 
    isGroupsLoading, 
    getUserGroups, 
    setSelectedGroup 
  } = useGroupStore();
  
  const { authUser } = useAuthStore();

  useEffect(() => {
    getUserGroups();
  }, [getUserGroups]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastActivity = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const lastActivity = new Date(date);
    const diffInHours = Math.floor((now - lastActivity) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d`;
    return lastActivity.toLocaleDateString("vi-VN");
  };

  const getUserRole = (group) => {
    if (group.admin._id === authUser._id) return "admin";
    const member = group.members.find(m => m.user._id === authUser._id);
    return member?.role || "member";
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown size={14} className="text-yellow-500" />;
      case "moderator":
        return <Shield size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <aside className="h-full w-80 bg-base-100 border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} />
            Nhóm chat
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm btn-circle"
            title="Tạo nhóm mới"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm..."
            className="input input-bordered w-full pl-9 input-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {isGroupsLoading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-base-content/60">
            {searchTerm ? "Không tìm thấy nhóm nào" : "Chưa có nhóm nào"}
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {filteredGroups.map((group) => {
              const userRole = getUserRole(group);
              const isSelected = selectedGroup?._id === group._id;
              
              return (
                <div
                  key={group._id}
                  onClick={() => setSelectedGroup(group)}
                  className={`p-4 cursor-pointer hover:bg-base-200 transition-colors ${
                    isSelected ? "bg-primary/10 border-r-2 border-primary" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Group Avatar */}
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                        {group.profilePic ? (
                          <img
                            src={group.profilePic}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users size={20} className="text-base-content/60" />
                        )}
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium truncate">{group.name}</h3>
                        {getRoleIcon(userRole)}
                        {group.isPrivate && (
                          <div className="badge badge-sm badge-ghost">Riêng tư</div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-base-content/60 truncate">
                          {group.lastMessage?.text || 
                           (group.lastMessage?.image && "📷 Hình ảnh") ||
                           (group.lastMessage?.video && "🎥 Video") ||
                           "Chưa có tin nhắn"}
                        </p>
                        <span className="text-xs text-base-content/40">
                          {formatLastActivity(group.lastActivity)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-base-content/50">
                          {group.members.length} thành viên
                        </span>
                        {group.lastMessage && (
                          <div className="flex items-center space-x-1">
                            {group.lastMessage.senderId._id === authUser._id ? (
                              <span className="text-xs text-base-content/40">Bạn: </span>
                            ) : (
                              <span className="text-xs text-base-content/40">
                                {group.lastMessage.senderId.fullName}: 
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </aside>
  );
};

export default GroupSidebar;