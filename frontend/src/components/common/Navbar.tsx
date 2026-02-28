import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/images/logo.png';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `transition font-medium ${
      isActive(path)
        ? 'text-orange-500 font-semibold'
        : 'text-gray-700 hover:text-orange-500'
    }`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50 py-4">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
        {/* Left: Logo + Become Technician */}
        <div className="flex items-center gap-6">
          <Link to="/" className="shrink-0">
            <img src={logoImg} alt="Kaam Chha Logo" className="h-12 w-auto" />
          </Link>
          {!user && (
            <Link 
              to="/auth/register-technician" 
              className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
            >
              Become Technician
            </Link>
          )}
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center space-x-10 text-sm font-medium">
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/services" className={navLinkClass('/services')}>Services</Link>
          <Link
            to="/#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname === '/') {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/', { state: { scrollTo: 'how-it-works' } });
              }
            }}
            className={navLinkClass('/how-it-works')}
          >
            How It Works
          </Link>
          <Link to="/about" className={navLinkClass('/about')}>About Us</Link>
        </div>

        {/* Right: Auth Buttons or Profile */}
        <div className="flex items-center space-x-4">
          {!user ? (
            // Not logged in - show Sign In and Join Now
            <>
              <Link to="/auth/login" className="text-gray-700 hover:text-orange-500 text-sm font-medium transition">
                Sign In
              </Link>
              <Link 
                to="/auth/register" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-6 py-2.5 rounded-full font-medium transition shadow-md shadow-orange-500/30 hover:shadow-lg"
              >
                Join Now
              </Link>
            </>
          ) : (
            // Logged in - show notification bell + profile dropdown
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {getInitials(user.name, user.email)}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {user.name || 'User'}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      user.role === 'TECHNICIAN' 
                        ? 'bg-blue-100 text-blue-700' 
                        : user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Menu Items */}
                  {/* Dashboard link based on role */}
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <LayoutDashboard size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  {user.role === 'TECHNICIAN' && (
                    <Link
                      to="/technician/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <LayoutDashboard size={16} />
                      <span>My Dashboard</span>
                    </Link>
                  )}
                  {user.role === 'CUSTOMER' && (
                    <Link
                      to="/my-bookings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <ClipboardList size={16} />
                      <span>My Bookings</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
