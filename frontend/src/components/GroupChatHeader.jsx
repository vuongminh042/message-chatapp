import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Settings, UserPlus, LogOut, Crown, Shield } from "lucide-react";
import GroupSettingsModal from "./GroupSettingsModal";

const GroupChatHeader = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  const { selectedGroup, leaveGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  if (!selectedGroup) return null;

  const getUserRole = () => {
    if (selectedGroup.admin._id === authUser._id) return "admin";
    const member = selectedGroup.members.find(m => m.user._id === authUser._id);
    return member?.role || "member";
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown size={16} className="text-yellow-500" />;
      case "moderator":
        return <Shield size={16} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này?")) {
      try {
        await leaveGroup(selectedGroup._id);
      } catch (error) {
        console.error("Error leaving group:", error);
      }
    }
  };

  const userRole = getUserRole();
  const canManageGroup = userRole === "admin" || userRole === "moderator";

  return (
    <>
      <div className="border-b border-base-300 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Group Avatar */}
            <div className="avatar">
              <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                {selectedGroup.profilePic ? (
                  <img
                    src={selectedGroup.profilePic}
                    alt={selectedGroup.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={24} className="text-base-content/60" />
                )}
              </div>
            </div>

            {/* Group Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold text-lg">{selectedGroup.name}</h1>
                {getRoleIcon(userRole)}
                {selectedGroup.isPrivate && (
                  <div className="badge badge-sm badge-ghost">Riêng tư</div>
                )}
              </div>
              <p className="text-sm text-base-content/60">
                {selectedGroup.members.length} thành viên
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {canManageGroup && (
              <button
                onClick={() => setShowSettings(true)}
                className="btn btn-ghost btn-sm btn-circle"
                title="Cài đặt nhóm"
              >
                <Settings size={18} />
              </button>
            )}
            
            <button
              onClick={handleLeaveGroup}
              className="btn btn-ghost btn-sm btn-circle text-error"
              title="Rời khỏi nhóm"
            >
              <LogOut size={18} />
            </button>

            {/* Dropdown for more actions */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
                <li>
                  <button onClick={() => setShowSettings(true)}>
                    <Users size={16} />
                    Xem thành viên
                  </button>
                </li>
                {canManageGroup && (
                  <li>
                    <button>
                      <UserPlus size={16} />
                      Thêm thành viên
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={handleLeaveGroup} className="text-error">
                    <LogOut size={16} />
                    Rời khỏi nhóm
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Group Settings Modal */}
      {showSettings && (
        <GroupSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          group={selectedGroup}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default GroupChatHeader;