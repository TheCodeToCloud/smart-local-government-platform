import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link-active' : 'nav-link';

  const userLinks = (
    <>
      <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Dashboard
      </NavLink>
      <NavLink to="/apply" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Apply
      </NavLink>
      <NavLink to="/applications" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        My Applications
      </NavLink>
      <NavLink to="/certificates" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Certificates
      </NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Admin Dashboard
      </NavLink>
      <NavLink to="/admin/applications" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        All Applications
      </NavLink>
      <NavLink to="/admin/users" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Manage Users
      </NavLink>
    </>
  );

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/Emblem_of_Nepal.svg.png" 
              alt="Emblem of Nepal" 
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
            />
            <div>
              <div className="font-bold text-slate-800 text-sm leading-none font-nepali">
                स्मार्ट सरकार
              </div>
              <div className="text-xs text-slate-500 leading-none mt-0.5">
                Smart Gov Nepal
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && user?.role === 'admin' && adminLinks}
            {isAuthenticated && user?.role === 'user' && userLinks}
            {!isAuthenticated && (
              <>
                <NavLink to="/" className={navLinkClass} end>Home</NavLink>
                <NavLink to="/login" className={navLinkClass}>Login</NavLink>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-avatar-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100
                             transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="w-8 h-8 rounded-full bg-gov-gradient flex items-center justify-center
                                  text-sm font-bold text-white shadow-md">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.fullName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-800 leading-none">{user.fullName.split(' ')[0]}</p>
                    <p className="text-xs text-slate-500 leading-none mt-0.5 capitalize">{user.role}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg
                                  animate-slide-down overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to={user.role === 'admin' ? '/admin/profile' : '/profile'}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600
                                   hover:text-primary-700 hover:bg-slate-50 transition-colors"
                      >
                        <span>👤</span> Profile Settings
                      </Link>
                      {user.role === 'user' && (
                        <Link
                          to="/applications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600
                                     hover:text-primary-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>📋</span> My Applications
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                                   hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-ghost p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-slide-down shadow-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {isAuthenticated && user?.role === 'admin' && adminLinks}
            {isAuthenticated && user?.role === 'user' && userLinks}
            {!isAuthenticated && (
              <>
                <NavLink to="/" className={navLinkClass} end onClick={() => setMobileOpen(false)}>Home</NavLink>
                <NavLink to="/login" className={navLinkClass} onClick={() => setMobileOpen(false)}>Login</NavLink>
                <NavLink to="/register" className={navLinkClass} onClick={() => setMobileOpen(false)}>Register</NavLink>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-left text-red-500 hover:text-red-700 font-medium text-sm px-3 py-2
                           rounded-lg hover:bg-red-50 transition-colors mt-2"
              >
                🚪 Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
