import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageCircle } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 bg-gray-900 text-gray-200">
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
              <h1 className="text-3xl font-extrabold mt-3 text-white">Chào mừng bạn trở lại 😊</h1>
              <p className="text-white-400 text-base">Đăng nhập vào tài khoản của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-white">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
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
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-12 bg-gray-800 border-orange-400 text-gray-100 placeholder-gray-500 focus:border-green-400 focus:ring-blue-500"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white hover:text-orange-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full bg-orange-600 hover:bg-green-400 border-none text-white font-bold hover:text-black shadow-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-white text-sm">
              Bạn chưa có tài khoản?{" "}
              <Link to="/signup" className="text-orange-400 font-bold hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title={"Chào mừng bạn trở lại!"}
        subtitle={"Hãy đăng nhập để tiếp tục cuộc trò chuyện!"}
      />
    </div>
  );
};
export default LoginPage;
