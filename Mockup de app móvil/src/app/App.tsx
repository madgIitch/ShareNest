import { useState } from 'react';
import { MobileNavBar } from './components/MobileNavBar';
import { ExploreScreen } from './screens/ExploreScreen';
import { MyListingsScreen } from './screens/MyListingsScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');

  const renderScreen = () => {
    switch (activeTab) {
      case 'explore':
        return <ExploreScreen />;
      case 'listings':
        return <MyListingsScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <ExploreScreen />;
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Frame */}
      <div className="flex items-center justify-center w-full h-full p-4">
        <div className="relative w-full max-w-[390px] h-full max-h-[844px] bg-black rounded-[3rem] shadow-2xl overflow-hidden">
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>
          
          {/* Screen Content */}
          <div className="relative w-full h-full bg-white overflow-hidden rounded-[2.5rem]">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-11 bg-white z-40 flex items-center justify-between px-8 pt-2">
              <span className="text-sm">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
                  <path d="M1 11V1H15V11H1Z" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <rect x="2" y="2" width="11" height="8" fill="currentColor"/>
                  <rect x="15.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="h-full pt-11">
              {renderScreen()}
            </div>
            
            {/* Bottom Navigation */}
            <MobileNavBar 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              unreadMessages={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
