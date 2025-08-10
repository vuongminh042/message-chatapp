import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { selectedUser } = useChatStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 px-0">
        <div className="bg-base-100 rounded-t-lg shadow-cl w-full h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex h-full rounded-t-lg overflow-hidden relative flex-1">
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={closeSidebar}
                style={{ 
                  top: '4rem',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  borderRadius: '0',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  transition: 'opacity 0.3s ease-in-out',
                  backdropFilter: 'blur(2px)',
                  animation: 'fadeIn 0.3s ease-in-out',
                  willChange: 'opacity',
                  transform: 'translateZ(0)'
                }}
              />
            )}
            
            <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

            <div className="flex-1">
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
