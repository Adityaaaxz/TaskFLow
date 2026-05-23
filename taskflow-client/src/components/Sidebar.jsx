import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  LogOut,
  Settings,
  UserCircle
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      backgroundColor: 'rgba(5, 5, 5, 0.95)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      zIndex: 10,
    }}>
      <div className="flex items-center gap-3 mb-10 text-xl font-bold px-2">
        <div style={{ 
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          padding: '0.5rem',
          borderRadius: '10px',
          color: 'white',
          display: 'flex',
          boxShadow: '0 4px 15px rgba(129, 140, 248, 0.3)'
        }}>
          <CheckSquare size={20} strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>TaskFlow</span>
      </div>

      <nav className="flex-col gap-2" style={{ flex: 1 }}>
        <p className="text-xs text-muted mb-4 px-2 uppercase tracking-wider font-semibold">Menu</p>
        
        <NavLink 
          to="/" 
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            marginBottom: '0.25rem',
            fontWeight: isActive ? '500' : '400',
            transition: 'var(--transition)'
          })}
        >
          <LayoutDashboard size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            marginBottom: '0.25rem',
            fontWeight: isActive ? '500' : '400',
            transition: 'var(--transition)'
          })}
        >
          <FolderKanban size={18} style={{ color: 'var(--accent-secondary)' }} />
          <span>Projects</span>
        </NavLink>

        <NavLink 
          to="/tasks"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            marginBottom: '0.25rem',
            fontWeight: isActive ? '500' : '400',
            transition: 'var(--transition)'
          })}
        >
          <CheckSquare size={18} style={{ color: 'var(--success)' }} />
          <span>My Tasks</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button 
          onClick={logout}
          className="btn btn-secondary w-full justify-center"
          style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
