import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageCircle, User } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Vui lòng nhập họ và tên.");
    if (!formData.email.trim()) return toast.error("Vui lòng nhập email");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Email không đúng định dạng. Vui lòng thử lại");
    if (!formData.password) return toast.error("Vui lòng nhập mật khẩu");
    if (formData.password.length < 6) return toast.error("Mật khẩu phải có ít nhất 6 ký tự.");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-900 text-gray-200">
      <div className="flex flex-col justify-center items-center p-8 sm:p-16">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center mb-10">
            <div className="flex flex-col items-center gap-3 group">
              <div
                className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center group-hover:bg-green-400/50
              transition-colors duration-300"
              >
                <MessageCircle className="w-5 h-5 text-danger font-semibold" />
              </div>
              <h1 className="text-3xl font-extrabold mt-3 text-white">Đăng ký</h1>
              <p className="text-white text-base">Tạo tài khoản miễn phí để bắt đầu ngay!</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-white">Họ và Tên</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-12 bg-gray-800 border-orange-400 text-gray-100 placeholder-gray-500 focus:border-green-400 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-white">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-12 bg-gray-800 border-orange-400 text-gray-100 placeholder-gray-500 focus:border-green-400 focus:ring-blue-500"
                  placeholder="nguyenvana@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-white">Mật khẩu</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-12 bg-gray-800 border-orange-400 text-gray-100 placeholder-gray-500 focus:border-green-400 focus:ring-blue-500"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white hover:text-orange-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full bg-orange-600 hover:bg-green-400 border-none text-white font-bold hover:text-black shadow-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-white text-sm">
              Bạn đã có tài khoản?{" "}
              <Link to="/login" className="text-orange-400 font-bold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Tham gia ứng dụng chat của tôi"
        subtitle="Kết nối mọi lúc, sẻ chia mọi điều – với những người bạn yêu quý."
      />
    </div>
  );
};

export default SignUpPage;
