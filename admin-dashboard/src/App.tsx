import { useState } from 'react';
import { LayoutDashboard, Pizza, Gift, Users, LogOut, ScanLine, Truck } from 'lucide-react';
import MenuManager from './MenuManager';
import VerifyPage from './VerifyPage';
import DispatchPage from './DispatchPage';
import OffersManager from './OffersManager';
import './Admin.css';
import { supabase } from './lib/supabase';

// Sidebar Item Component
const SidebarItem = ({ id, icon, label, active, set }: any) => (
  <button
    onClick={() => set(id)}
    className={`nav-item ${active === id ? 'active' : ''}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('dispatch');

  // Simple Logout
  const handleLogout = async () => {
    // Just reload or clear session
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">T</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Admin Console</span>
        </div>

        <nav className="sidebar-nav">
          <SidebarItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab} set={setActiveTab} />
          <SidebarItem id="dispatch" icon={<Truck size={20} />} label="Dispatch" active={activeTab} set={setActiveTab} />
          <SidebarItem id="menu" icon={<Pizza size={20} />} label="Menu & Products" active={activeTab} set={setActiveTab} />
          <SidebarItem id="verify" icon={<ScanLine size={20} />} label="Verify QR/Code" active={activeTab} set={setActiveTab} />
          <SidebarItem id="offers" icon={<Gift size={20} />} label="Offers & QR" active={activeTab} set={setActiveTab} />
          <SidebarItem id="users" icon={<Users size={20} />} label="Loyalty & Users" active={activeTab} set={setActiveTab} />
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="page-title">
            {activeTab === 'menu' ? 'Menu Management' :
              activeTab === 'dispatch' ? 'Dispatch Consegne' : activeTab}
          </h2>
        </header>

        <div className="content-area">
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'verify' && <VerifyPage />}
          {activeTab === 'dispatch' && <DispatchPage />}

          {activeTab === 'dashboard' && (
            <div className="grid-container">
              <div className="stat-card">
                <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>TOTAL ORDERS</h3>
                <p className="stat-value">1,234</p>
              </div>
              <div className="stat-card" style={{ borderLeftColor: '#22c55e' }}>
                <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>ACTIVE PRODUCTS</h3>
                <p className="stat-value">45</p>
              </div>
              <div className="stat-card" style={{ borderLeftColor: '#a855f7' }}>
                <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>LOYALTY USERS</h3>
                <p className="stat-value">890</p>
              </div>
            </div>
          )}

          {activeTab === 'offers' && <OffersManager />}

          {activeTab === 'users' && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed' }}>
              <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <h3>Loyalty System</h3>
              <p style={{ color: '#64748b' }}>Manage user points (10 orders = Free Pizza logic).</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;

