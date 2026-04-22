import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  LayoutDashboard, 
  ChefHat, 
  Dumbbell, 
  Bed, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Package,
  Wrench,
  User,
  ShieldCheck
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(localStorage.getItem('swiss_side_user') || 'Manager');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sessionToken = localStorage.getItem('swiss_side_session') || '';
  const verifiedUser = useQuery(api.users.verifySession, { token: sessionToken });

  useEffect(() => {
    if (verifiedUser === null) {
      localStorage.removeItem('swiss_side_session');
      localStorage.removeItem('swiss_side_user');
      navigate('/login');
    }
  }, [verifiedUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('swiss_side_session');
    localStorage.removeItem('swiss_side_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navGroups = [
    {
      id: 'hubs',
      title: 'Facility Operations',
      icon: Package,
      items: [
        { name: 'Kitchen Hub', path: '/inventory', icon: ChefHat },
        { name: 'Gym Center', path: '/gym-inventory', icon: Dumbbell },
        { name: 'Room Registry', path: '/rooms', icon: Bed },
        { name: 'General Supplies', path: '/general-supplies', icon: Package },
      ]
    },
    {
      id: 'admin',
      title: 'Administrative',
      icon: ShieldCheck,
      items: [
        { name: 'Operational Intelligence', path: '/reports', icon: BarChart3 },
        { name: 'Audit Logs', path: '/history', icon: History },
        { name: 'System Configuration', path: '/settings', icon: Settings },
      ]
    }
  ];

  const [expandedGroups, setExpandedGroups] = useState(['hubs']);

  const toggleGroup = (id) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-600 font-sans border-r border-slate-100">
      {/* Brand */}
      <div className="h-[120px] px-8 flex flex-col items-center justify-center border-b border-slate-50 bg-slate-50/30">
        <div className="w-[60px] h-[60px] bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100 mb-2">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Swiss Side Iten</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 no-scrollbar">
        {/* Main Links */}
        <NavLink
          to="/dashboard"
          onClick={() => setIsMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group mb-4 ${
              isActive 
                ? 'bg-primary text-white shadow-premium' 
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <button 
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                {group.title}
              </div>
              <ChevronRight size={12} className={`transition-transform duration-300 ${expandedGroups.includes(group.id) ? 'rotate-90' : ''}`} />
            </button>
            
            {expandedGroups.includes(group.id) && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                        isActive 
                          ? 'text-primary bg-primary/5 font-bold' 
                          : 'text-slate-500 hover:text-primary hover:bg-slate-50'
                      }`
                    }
                  >
                    <item.icon size={16} className={location.pathname === item.path ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User / Footer */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-4 px-3 py-3 mb-4 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 overflow-hidden">
            <img src="/logo.png" alt="User" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{userEmail.split('@')[0]}</p>
            <p className="text-[9px] text-slate-400 truncate uppercase tracking-widest font-black">Authorized</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-slate-400 hover:text-danger hover:bg-danger/5 rounded-xl transition-all uppercase tracking-[0.2em]"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-900 selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-right" />
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block w-[280px] fixed inset-y-0 z-50 transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-[72px] bg-white border-b border-slate-100 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 uppercase tracking-widest">Swiss Side</h1>
            <p className="text-[10px] font-bold text-primary uppercase">Management</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex animate-in fade-in duration-300">
          <div className="w-[300px] h-full shadow-elevated animate-in slide-in-from-left duration-500">
            <SidebarContent />
          </div>
          <div 
            className="flex-1 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'md:pl-[280px]' : ''} pt-[72px] md:pt-0`}>
        <div className="flex-1 p-6 md:p-12 lg:p-16 w-full max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
