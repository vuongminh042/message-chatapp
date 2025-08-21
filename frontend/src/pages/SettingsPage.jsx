import { useThemeStore } from "../store/useThemeStore";
import { Send, Check, Sun, Moon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [selectedTheme, setSelectedTheme] = useState(theme);

  const handleThemeSelect = (newTheme) => {
    setSelectedTheme(newTheme);
  };

  const handleApplyTheme = () => {
    setTheme(selectedTheme);
    toast.success("Cập nhật giao diện thành công!", {
      duration: 3000,
      position: "top-center",
      style: {
        background: "#ffffff",
        color: "#000000",
      },
    });
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-orange-400">Giao diện chat</h2>
          <p className="text-sm text-base-content/70 text-orange-400">Chọn giao diện cho đoạn chat của bạn</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`btn ${selectedTheme === "light" ? "btn-primary" : "btn-outline"} flex items-center gap-2`}
            onClick={() => handleThemeSelect("light")}
          >
            <Sun size={16} /> Sáng
          </button>
          <button
            className={`btn ${selectedTheme === "dark" ? "btn-primary" : "btn-outline"} flex items-center gap-2`}
            onClick={() => handleThemeSelect("dark")}
          >
            <Moon size={16} /> Tối
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleApplyTheme}
            disabled={selectedTheme === theme}
            className={`
              btn btn-primary px-8 flex items-center gap-2
              ${selectedTheme === theme ? 'btn-disabled opacity-50' : ''}
            `}
          >
            <Check className="w-4 h-4" />
            Áp dụng giao diện
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
