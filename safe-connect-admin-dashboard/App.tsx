import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, logout, selectUser, loginSuccess } from './store/authSlice';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SOSManagement from './components/SOSManagement';
import VolunteerManagement from './components/VolunteerManagement';
import UserManagement from './components/UserManagement';
import CommunityManagement from './components/CommunityManagement';
import BlogManagement from './components/BlogManagement';
import { HomeIcon, ShieldAlertIcon, UsersIcon, UserCogIcon, MessageSquareIcon, FileTextIcon, LogOutIcon } from './components/icons';

import { volunteerService } from './services/volunteerService';
import { articleService } from './services/articleService';

type NavItem = 'dashboard' | 'sos' | 'volunteers' | 'users' | 'community' | 'blog';

const NavLink: React.FC<{
    nav: NavItem;
    icon: React.ReactNode;
    label: string;
    count?: number;
    activeNav: NavItem;
    setActiveNav: (nav: NavItem) => void;
}> = ({ nav, icon, label, count, activeNav, setActiveNav }) => (
    <button
        onClick={() => setActiveNav(nav)}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${activeNav === nav ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
    >
        {icon}
        <span className="ml-3">{label}</span>
        {count !== undefined && count > 0 && <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium bg-red-600 text-red-100 rounded-full">{count}</span>}
    </button>
);

const App: React.FC = () => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const adminUser = useSelector(selectUser);
    const dispatch = useDispatch();

    const [activeNav, setActiveNav] = useState<NavItem>('dashboard');

    // Fetch counts for sidebar badges
    const [volunteerCount, setVolunteerCount] = useState(0);
    const [communityCount, setCommunityCount] = useState(0);

    // Check token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                dispatch(loginSuccess({ user, token }));
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [dispatch]);

    // Fetch counts when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const fetchCounts = async () => {
                try {
                    const [volunteersRes, postsRes] = await Promise.all([
                        volunteerService.getVolunteers({ status: 'PENDING', limit: 1 }),
                        articleService.getArticles({ category: 'COMMUNITY', status: 'PENDING', limit: 1 }),
                    ]);
                    setVolunteerCount(volunteersRes.pagination?.total || 0);
                    setCommunityCount(postsRes.pagination?.total || 0);
                } catch (error) {
                    console.error('Error fetching counts:', error);
                }
            };
            fetchCounts();
        }
    }, [isAuthenticated]);

    if (!isAuthenticated || !adminUser) {
        console.log('Not authenticated:', { isAuthenticated, adminUser }); // Debug log
        return <Login />;
    }

    console.log('Authenticated, rendering dashboard'); // Debug log

    const renderContent = () => {
        switch (activeNav) {
            case 'dashboard':
                return <Dashboard />;
            case 'sos':
                return <SOSManagement />;
            case 'volunteers':
                return <VolunteerManagement />;
            case 'users':
                return <UserManagement />;
            case 'community':
                return <CommunityManagement />;
            case 'blog':
                return <BlogManagement />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar */}
            <div className="flex flex-col w-64 bg-gray-800">
                <div className="flex items-center justify-center h-20 shadow-md">
                    <h1 className="text-2xl font-bold text-white">SOS Admin</h1>
                </div>
                <nav className="flex-grow mt-5">
                    <NavLink nav="dashboard" icon={<HomeIcon className="w-5 h-5" />} label="Bảng điều khiển" activeNav={activeNav} setActiveNav={setActiveNav} />
                    <NavLink nav="sos" icon={<ShieldAlertIcon className="w-5 h-5" />} label="Quản lý SOS" activeNav={activeNav} setActiveNav={setActiveNav} />
                    <NavLink nav="volunteers" icon={<UsersIcon className="w-5 h-5" />} label="Quản lý TNV" count={volunteerCount} activeNav={activeNav} setActiveNav={setActiveNav} />
                    <NavLink nav="community" icon={<MessageSquareIcon className="w-5 h-5" />} label="Quản lý Cộng đồng" count={communityCount} activeNav={activeNav} setActiveNav={setActiveNav} />
                    <NavLink nav="users" icon={<UserCogIcon className="w-5 h-5" />} label="Quản lý Người dùng" activeNav={activeNav} setActiveNav={setActiveNav} />
                    <NavLink nav="blog" icon={<FileTextIcon className="w-5 h-5" />} label="Quản lý Blog" activeNav={activeNav} setActiveNav={setActiveNav} />
                </nav>
                 <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <img src={adminUser.avatar} alt="Admin" className="w-10 h-10 rounded-full"/>
                        <div className="ml-3">
                            <p className="text-sm font-semibold text-white">{adminUser.name}</p>
                            <p className="text-xs text-gray-400">Admin</p>
                        </div>
                    </div>
                     <button
                        onClick={() => dispatch(logout())}
                        className="flex items-center w-full px-4 py-3 mt-4 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                    >
                       <LogOutIcon className="w-5 h-5"/>
                       <span className="ml-3">Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;