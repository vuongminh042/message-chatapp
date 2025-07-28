import { useState } from "react";
import { X, Camera, UserPlus, Trash2, Crown, Shield, User } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ isOpen, onClose, group, userRole }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description
  });
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const { updateGroup, addMemberToGroup, removeMemberFromGroup } = useGroupStore();
  const { users } = useChatStore();
  const { authUser } = useAuthStore();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGroup = async () => {
    try {
      await updateGroup(group._id, {
        ...formData,
        profilePic: newProfilePic
      });
      setEditMode(false);
      setNewProfilePic(null);
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    try {
      await addMemberToGroup(group._id, selectedMembers);
      setSelectedMembers([]);
    } catch (error) {
      console.error("Error adding members:", error);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
      try {
        await removeMemberFromGroup(group._id, userId);
      } catch (error) {
        console.error("Error removing member:", error);
      }
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const availableUsers = users.filter(user => 
    !group.members.some(member => member.user._id === user._id)
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown size={16} className="text-yellow-500" />;
      case "moderator":
        return <Shield size={16} className="text-blue-500" />;
      default:
        return <User size={16} className="text-base-content/60" />;
    }
  };

  const canManageMembers = userRole === "admin" || userRole === "moderator";
  const canEditGroup = userRole === "admin" || userRole === "moderator";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-bold">Cài đặt nhóm</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered">
          <button
            className={`tab ${activeTab === "info" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin
          </button>
          <button
            className={`tab ${activeTab === "members" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Thành viên ({group.members.length})
          </button>
          {canManageMembers && (
            <button
              className={`tab ${activeTab === "add" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              Thêm thành viên
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Group Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                    {newProfilePic || group.profilePic ? (
                      <img
                        src={newProfilePic || group.profilePic}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-base-content/60" />
                    )}
                  </div>
                  {editMode && canEditGroup && (
                    <label htmlFor="group-pic" className="absolute -bottom-1 -right-1 btn btn-circle btn-xs btn-primary">
                      <Camera size={12} />
                    </label>
                  )}
                  <input
                    id="group-pic"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!editMode || !canEditGroup}
                  />
                </div>
              </div>

              {/* Group Info */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tên nhóm</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    maxLength={100}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Mô tả</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-title">Thành viên</div>
                    <div className="stat-value text-lg">{group.members.length}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-title">Loại nhóm</div>
                    <div className="stat-value text-lg">
                      {group.isPrivate ? "Riêng tư" : "Công khai"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {canEditGroup && (
                <div className="flex space-x-2">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="btn btn-primary flex-1"
                    >
                      Chỉnh sửa
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: group.name,
                            description: group.description
                          });
                          setNewProfilePic(null);
                        }}
                        className="btn btn-ghost flex-1"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateGroup}
                        className="btn btn-primary flex-1"
                      >
                        Lưu
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.user._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={member.user.profilePic || "/avatar.png"}
                          alt={member.user.fullName}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{member.user.fullName}</p>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-base-content/60">{member.user.email}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {member.user._id === authUser._id && (
                      <div className="badge badge-primary badge-sm">Bạn</div>
                    )}
                    
                    {userRole === "admin" && member.user._id !== authUser._id && (
                      <button
                        onClick={() => handleRemoveMember(member.user._id)}
                        className="btn btn-error btn-sm btn-circle"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Members Tab */}
          {activeTab === "add" && canManageMembers && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Chọn thành viên để thêm</h3>
                {selectedMembers.length > 0 && (
                  <button
                    onClick={handleAddMembers}
                    className="btn btn-primary btn-sm"
                  >
                    <UserPlus size={16} />
                    Thêm ({selectedMembers.length})
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <label key={user._id} className="flex items-center space-x-3 p-3 hover:bg-base-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedMembers.includes(user._id)}
                        onChange={() => toggleMemberSelection(user._id)}
                      />
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full">
                          <img
                            src={user.profilePic || "/avatar.png"}
                            alt={user.fullName}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-base-content/60">{user.email}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    Không có người dùng nào để thêm
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;