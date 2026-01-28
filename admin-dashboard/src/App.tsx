import { useState, useEffect } from 'react';
import { LayoutDashboard, Pizza, Gift, Users, LogOut, ScanLine, Truck, ShoppingBag, TrendingUp } from 'lucide-react';
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
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      orders: ordersRes.count || 0,
      products: productsRes.count || 0,
      users: 0
    });
  };

  // Simple Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'menu': return 'Menu Management';
      case 'dispatch': return 'Dispatch Console';
      case 'verify': return 'Verify QR Codes';
      case 'offers': return 'Offers & Promotions';
      case 'users': return 'Loyalty Program';
      default: return 'Dashboard Overview';
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">R</div>
          <div>
            <span className="brand-name">Rasht</span>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Console</p>
          </div>
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
          <h2 className="page-title">{getPageTitle()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              ● Online
            </span>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'verify' && <VerifyPage />}
          {activeTab === 'dispatch' && <DispatchPage />}
          {activeTab === 'offers' && <OffersManager />}

          {activeTab === 'dashboard' && (
            <div>
              <div className="grid-container" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(201, 164, 92, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <ShoppingBag size={24} color="var(--persian-gold)" />
                    </div>
                    <div>
                      <p className="stat-label">TOTAL ORDERS</p>
                      <p className="stat-value">{stats.orders.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Pizza size={24} color="var(--success)" />
                    </div>
                    <div>
                      <p className="stat-label">ACTIVE PRODUCTS</p>
                      <p className="stat-value" style={{ color: 'var(--success)' }}>{stats.products}</p>
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--info)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingUp size={24} color="var(--info)" />
                    </div>
                    <div>
                      <p className="stat-label">REVENUE TODAY</p>
                      <p className="stat-value" style={{ color: 'var(--info)' }}>€0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <LayoutDashboard size={48} color="var(--persian-gold)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome to Rasht Admin</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                  Use the sidebar to navigate between different management sections.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Users size={48} color="var(--persian-gold)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--text-primary)' }}>Loyalty System</h3>
              <p style={{ color: 'var(--text-muted)' }}>Manage user points (10 orders = Free Pizza logic).</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
