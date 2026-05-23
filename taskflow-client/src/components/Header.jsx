import { useAuth } from '../context/AuthContext';
import { Search, Bell, UserCircle } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div className="search-bar">
        <Search size={16} className="text-muted" />
        <input type="text" placeholder="Search projects or tasks..." />
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-icon">
          <Bell size={20} />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-800 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg">
            <UserCircle size={24} color="white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
