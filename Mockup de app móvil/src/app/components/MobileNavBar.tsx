import { Home, PlusCircle, MessageCircle, User } from 'lucide-react';

export interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessages?: number;
}

export function MobileNavBar({ activeTab, onTabChange, unreadMessages = 0 }: MobileNavBarProps) {
  const tabs = [
    { id: 'explore', label: 'Explorar', icon: Home },
    { id: 'listings', label: 'Anuncios', icon: PlusCircle },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle, badge: unreadMessages },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around px-2 pb-2 pt-1">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center py-2 px-4 relative transition-colors ${
              activeTab === id ? 'text-emerald-600' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <Icon className={`w-6 h-6 ${activeTab === id ? 'fill-emerald-100' : ''}`} />
              {badge && badge > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white">{badge > 9 ? '9+' : badge}</span>
                </div>
              )}
            </div>
            <span className="text-xs mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
