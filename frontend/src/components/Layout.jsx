import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

const Layout = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState(localStorage.getItem('swiss_side_user') || 'Manager');

  useEffect(() => {
    const session = localStorage.getItem('swiss_side_session');
    if (!session) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('swiss_side_session');
    localStorage.removeItem('swiss_side_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Transactions', path: '/history' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Toaster position="top-right" />
      
      {/* Fixed Header */}
      <header className="h-[64px] bg-white border-b border-slate-200 sticky top-0 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-[44px] w-[44px] bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-100">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Swiss Side Stock</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authenticated As</span>
            <span className="text-sm font-bold text-primary lowercase">{userEmail}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-danger transition-colors uppercase tracking-widest border border-slate-200 px-3 py-1.5 rounded-md hover:border-danger/20"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="h-[48px] bg-white border-b border-slate-200 px-6 flex sticky top-[64px] z-40 overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `h-full px-6 flex items-center text-sm font-medium transition-all relative border-b-[3px] ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Page Content */}
      <main className="flex-1 p-6 md:p-8 max-w-[1440px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
