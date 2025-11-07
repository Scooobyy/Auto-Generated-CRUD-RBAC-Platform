import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { modelsAPI } from '../../services/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await modelsAPI.getAll();
      setModels(response.data.models);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: '📊',
      current: location.pathname === '/'
    },
    { 
      name: 'Model Builder', 
      href: '/models', 
      icon: '🛠️',
      current: location.pathname === '/models'
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CRUD Platform</h1>
                <p className="text-xs text-gray-500">Low-Code Builder</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                          item.current
                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* Dynamic Models Quick Access */}
              {models.length > 0 && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400">Your Models</div>
                  <ul className="-mx-2 mt-2 space-y-1">
                    {models.map((model) => (
                      <li key={model.id}>
                        <Link
                          to={`/data/${model.name}`}
                          className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400">
                            {model.name.charAt(0)}
                          </span>
                          <span className="truncate">{model.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {/* Empty state for models */}
              {models.length === 0 && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400">Your Models</div>
                  <div className="mt-2 p-2 text-sm text-gray-500 bg-gray-50 rounded-md">
                    No models yet. <Link to="/models" className="text-blue-600 hover:text-blue-500">Create one</Link>
                  </div>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <span className="text-xl">☰</span>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Welcome, <span className="font-semibold">{user?.username}</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                      <span className="text-white font-bold text-lg">⚡</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">CRUD Platform</h1>
                  </div>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                                item.current
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <span className="text-lg">{item.icon}</span>
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;