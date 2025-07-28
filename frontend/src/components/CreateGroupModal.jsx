import { useState } from "react";
import { X, Users, Camera } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    maxMembers: 100,
    selectedMembers: []
  });
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { createGroup } = useGroupStore();
  const { users } = useChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const groupData = {
        ...formData,
        memberIds: formData.selectedMembers,
        profilePic
      };
      
      await createGroup(groupData);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        isPrivate: false,
        maxMembers: 100,
        selectedMembers: []
      });
      setProfilePic(null);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleMemberSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter(id => id !== userId)
        : [...prev.selectedMembers, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Tạo nhóm mới</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ảnh đại diện nhóm */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center overflow-hidden">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users size={32} className="text-base-content/60" />
                )}
              </div>
              <label htmlFor="group-avatar" className="absolute -bottom-1 -right-1 btn btn-circle btn-xs btn-primary">
                <Camera size={12} />
              </label>
              <input
                type="file"
                id="group-avatar"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Tên nhóm */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tên nhóm *</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên nhóm"
              className="input input-bordered"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              maxLength={100}
            />
          </div>

          {/* Mô tả */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Mô tả</span>
            </label>
            <textarea
              placeholder="Mô tả về nhóm"
              className="textarea textarea-bordered"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              maxLength={500}
            />
          </div>

          {/* Cài đặt nhóm */}
          <div className="space-y-3">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Nhóm riêng tư</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Số thành viên tối đa</span>
              </label>
              <input
                type="number"
                placeholder="100"
                className="input input-bordered"
                min={2}
                max={1000}
                value={formData.maxMembers}
                onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 100 }))}
              />
            </div>
          </div>

          {/* Chọn thành viên */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Thêm thành viên</span>
            </label>
            <div className="max-h-32 overflow-y-auto border border-base-300 rounded-lg p-2">
              {users.length > 0 ? (
                users.map((user) => (
                  <label key={user._id} className="flex items-center space-x-3 p-2 hover:bg-base-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={formData.selectedMembers.includes(user._id)}
                      onChange={() => toggleMemberSelection(user._id)}
                    />
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                        />
                      </div>
                    </div>
                    <span className="text-sm">{user.fullName}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-base-content/60 text-center py-4">
                  Không có người dùng khác
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Tạo nhóm"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;