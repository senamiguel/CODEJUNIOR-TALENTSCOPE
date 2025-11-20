import { LayoutDashboard, Users, MessageSquareText, UploadCloud, LogOut } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border ${
      active 
        ? 'bg-brand-purple/10 text-white border-brand-purple/50 shadow-[0_0_15px_rgba(130,87,229,0.15)]' 
        : 'text-brand-gray border-transparent hover:text-white hover:bg-brand-card'
    }`}
  >
    <Icon size={20} className={active ? "text-brand-purple" : "text-slate-500 group-hover:text-white"} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  return (
    <aside className="w-64 h-screen bg-[#09090A] border-r border-brand-border flex flex-col fixed left-0 top-0 z-20">
      <div className="p-8 pb-4">
         {/* CODE [] Logo - Sidebar Version */}
         <div className="font-black tracking-tighter text-3xl flex items-center gap-1 select-none cursor-default">
            <span className="text-brand-purple text-glow">CODE</span>
            <span className="text-brand-accent text-glow-green">[ ]</span>
          </div>
          <p className="text-[10px] text-brand-gray uppercase tracking-widest mt-1 pl-1 font-mono">
            Talent Scout
          </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
        <NavItem to="/members" icon={Users} label="Membros" active={location.pathname === '/members'} />
        <NavItem to="/agent" icon={MessageSquareText} label="IA Headhunter" active={location.pathname === '/agent'} />
        <NavItem to="/upload" icon={UploadCloud} label="Importar CVs" active={location.pathname === '/upload'} />
      </nav>

      <div className="p-6 border-t border-brand-border space-y-4">
        {currentUser && (
          <div className="flex items-center gap-3 px-2">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-brand-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-xs text-brand-purple font-bold">
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm text-white font-medium truncate">{currentUser.displayName || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        )}

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-brand-card hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-400 py-2 rounded-lg transition-all text-sm border border-brand-border"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  );
};