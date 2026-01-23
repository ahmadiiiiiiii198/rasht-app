import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Pizza, Gift, Users, Settings, LogOut } from 'lucide-react';
import MenuManager from './MenuManager';
import { supabase } from '../../lib/supabase';


const SidebarItem = ({ id, icon, label, active, set }: any) => (
    <button
        onClick={() => set(id)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${active === id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('menu');
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-xl">TO</div>
                    <span className="text-xl font-bold tracking-tight">Admin Console</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <SidebarItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab} set={setActiveTab} />
                    <SidebarItem id="menu" icon={<Pizza size={20} />} label="Menu Management" active={activeTab} set={setActiveTab} />
                    <SidebarItem id="offers" icon={<Gift size={20} />} label="Offers & QA" active={activeTab} set={setActiveTab} />
                    <SidebarItem id="users" icon={<Users size={20} />} label="Loyalty & Users" active={activeTab} set={setActiveTab} />
                    <SidebarItem id="settings" icon={<Settings size={20} />} label="Configuration" active={activeTab} set={setActiveTab} />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 transition-colors mt-auto"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-screen bg-gray-50">
                <header className="bg-white p-6 shadow-sm border-b sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-slate-800 capitalize">
                        {activeTab === 'menu' ? 'Menu & Products' : activeTab}
                    </h2>
                </header>

                <main className="p-8">
                    {activeTab === 'menu' && <MenuManager />}

                    {activeTab === 'offers' && (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
                            <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Offers Manager</h3>
                            <p className="text-gray-500">Configure special offers and generate QR codes here.</p>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Loyalty System</h3>
                            <p className="text-gray-500">Manage user points (10 orders = Free Pizza logic).</p>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DashboardCard title="Total Orders" value="1,234" color="blue" />
                            <DashboardCard title="Active Products" value="45" color="green" />
                            <DashboardCard title="Loyalty Users" value="890" color="purple" />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, value, color }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 border-${color}-500`}>
        <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
);

export default AdminDashboard;
