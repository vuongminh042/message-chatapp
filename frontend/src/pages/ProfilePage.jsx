import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="h-screen pt-20 bg-white text-white">
      <div className="max-w-2xl mx-auto p-6 py-10 bg-gray-800 rounded-3xl shadow-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold">Hồ sơ của bạn</h1>
          <p className="mt-2 text-white">Thông tin cá nhân của bạn</p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="relative">
            <img
              src={selectedImg || authUser.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover border-4 border-blue-600 shadow-md"
            />
            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700
                p-3 rounded-full cursor-pointer transition-transform duration-200
                ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
              `}
            >
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>
          <p className="text-sm text-white">
            {isUpdatingProfile ? "Đang tải ảnh lên..." : "Nhấn vào biểu tượng máy ảnh để cập nhật ảnh đại diện của bạn"}
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <User className="w-5 h-5 text-white" />
              <span className="text-white">Họ và Tên</span>
            </div>
            <p className="px-5 py-3 bg-gray-700 rounded-xl border border-gray-600 text-lg">{authUser?.fullName}</p>
          </div>

          <div>
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <Mail className="w-5 h-5 text-white" />
              <span className="text-white">Địa chỉ Email</span>
            </div>
            <p className="px-5 py-3 bg-gray-700 rounded-xl border border-gray-600 text-lg">{authUser?.email}</p>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 rounded-3xl p-6 shadow-inner">
          <h2 className="text-xl font-semibold mb-6 text-blue-400">Thông tin tài khoản</h2>
          <div className="space-y-4 text-gray-300 text-base">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <span className="text-white">Gia nhập từ</span>
              <span>{authUser.createdAt?.split("T")[0]}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-white">Trạng thái hoạt động</span>
              <span className="text-green-400 font-semibold">Đang hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
