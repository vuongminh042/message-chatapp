import { MessageCircle } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold">Chào mừng bạn đến với Blink Chat!</h2>
      </div>
    </div>
  );
};

export default NoChatSelected;
