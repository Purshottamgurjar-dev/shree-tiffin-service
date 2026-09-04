import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Utensils, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  LogOut,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Bike,
  ChefHat,
  Banknote,
  CreditCard,
  MapPin,
  ArrowRight,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import mealService from '../services/mealService';
import { getDashboardKPIs } from '../services/orderService';
import { formatCurrency, formatDate } from '../utils';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [mealStats, setMealStats] = useState({ total: 0, available: 0, unavailable: 0, featured: 0 });
  const [kpis, setKpis] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    outForDelivery: 0,
    deliveredToday: 0,
    todayRevenue: 0,
    pendingCod: 0,
    onlinePayments: 0,
    onlinePaidCount: 0,
    activeCustomers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [usersRes, statsRes, kpisRes] = await Promise.all([
        api.get('/users?limit=6'),
        mealService.getMealStats(),
        getDashboardKPIs(),
      ]);

      if (usersRes.data?.success && Array.isArray(usersRes.data.users)) {
        setCustomers(usersRes.data.users);
      }
      if (statsRes.success) {
        setMealStats(statsRes.data);
      }
      if (kpisRes.success && kpisRes.kpis) {
        setKpis(kpisRes.kpis);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch dashboard operational data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
      {/* Dashboard Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1c1917 0%, #2b221e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold-500)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Owner & Kitchen Operations Center
              </h1>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                Owner Verified
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Logged in as: <strong>{user?.name}</strong> ({user?.email}) • <em>"Ghar Jaisa Khana, Har Din."</em>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/admin/delivery"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7' }}
          >
            <Bike size={15} />
            <span>Delivery Map ({kpis.outForDelivery + kpis.preparingOrders})</span>
          </Link>
          <Link
            to="/admin/orders"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--primary-800)' }}
          >
            <ClipboardList size={15} />
            <span>Manage Orders</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ea580c' }}
          >
            <BarChart3 size={15} />
            <span>Business Analytics</span>
          </Link>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13.5px', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--status-danger)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PHASE 1: Real KPI Cards Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Real-Time Kitchen & Business KPIs
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '36px',
      }}>
        {/* 1. Today's Orders */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Today's Orders</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {kpis.todayOrders}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Placed since 00:00 today</span>
        </div>

        {/* 2. Pending Orders */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Pending Orders</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#b45309' }}>
            {kpis.pendingOrders}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Needs kitchen confirmation</span>
        </div>

        {/* 3. Preparing Orders */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Preparing in Kitchen</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#c2410c' }}>
            {kpis.preparingOrders}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Currently cooking hot thalis</span>
        </div>

        {/* 4. Out for Delivery */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Out for Delivery</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0369a1' }}>
            {kpis.outForDelivery}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Riders on route to customer</span>
        </div>

        {/* 5. Delivered Today */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--veg-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Delivered Today</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--veg-50)', color: 'var(--veg-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--veg-800)' }}>
            {kpis.deliveredToday}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Completed deliveries</span>
        </div>

        {/* 6. Today's Revenue */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Today's Revenue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#047857' }}>
            {formatCurrency(kpis.todayRevenue)}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Realized sales today</span>
        </div>

        {/* 7. Pending COD */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Pending COD Cash</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3e8ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#6d28d9' }}>
            {formatCurrency(kpis.pendingCod)}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>To be collected upon arrival</span>
        </div>

        {/* 8. Online Payments */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Online Payments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#cffafe', color: '#0e7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0e7490' }}>
            {formatCurrency(kpis.onlinePayments)}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{kpis.onlinePaidCount} settled online orders</span>
        </div>

        {/* 9. Active Customers */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Active Customers</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {kpis.activeCustomers}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Customers with orders</span>
        </div>
      </div>

      {/* Operational Control Shortcuts */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Operations Control Centers
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '36px',
      }}>
        <Link to="/admin/orders" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', height: '100%', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Order Management</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Filter, transition, search orders</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Advance status through Pending ➔ Confirmed ➔ Preparing ➔ Out for Delivery ➔ Delivered.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-700)', fontSize: '13px', fontWeight: '700' }}>
              <span>Open Orders ({kpis.totalOrders})</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link to="/admin/delivery" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', height: '100%', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bike size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Delivery Operations</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Live Leaflet Map & GPS Pins</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              View all active deliveries on Leaflet map, trigger native calls, WhatsApp messages, or Google Maps directions.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontSize: '13px', fontWeight: '700' }}>
              <span>Live Delivery Map</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link to="/admin/payments" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', height: '100%', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Banknote size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Payments & COD</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cash collected & Razorpay audit</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Collect pending cash on delivery payments with automated audit history and Razorpay transaction reconciliation.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6d28d9', fontSize: '13px', fontWeight: '700' }}>
              <span>Manage Payments</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link to="/admin/customers" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', height: '100%', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Customer Directory</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Lifetime value & order stats</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Customer lifetime orders, spending totals, phone numbers, delivery history, and direct WhatsApp support.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '13px', fontWeight: '700' }}>
              <span>View Customers</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link to="/admin/analytics" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', height: '100%', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s', background: 'linear-gradient(180deg, #ffffff 0%, #fffbf5 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Business Analytics</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Revenue, AOV, Profit & Reports</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Visual charts, realized revenue trends, best-selling meals, peak rush hours, customer retention, and CSV exports.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c', fontSize: '13px', fontWeight: '700' }}>
              <span>View Analytics</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>

      {/* Customer Overview Snapshot */}
      <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Recent Registered Customers
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Active users on Shree Tiffin Service</span>
          </div>
          <Link to="/admin/customers" className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
            View Full Customer Directory
          </Link>
        </div>

        {customers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No customers found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                  <th style={{ padding: '10px 12px' }}>Name</th>
                  <th style={{ padding: '10px 12px' }}>Contact</th>
                  <th style={{ padding: '10px 12px' }}>Joined Date</th>
                  <th style={{ padding: '10px 12px' }}>Total Orders</th>
                  <th style={{ padding: '10px 12px' }}>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {c.name}
                      {c.role === 'owner' && <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '10px' }}>Owner</span>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      <div>{c.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{c.phone || 'No phone'}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>
                      {c.stats?.totalOrders || 0}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '700', color: 'var(--primary-700)' }}>
                      {formatCurrency(c.stats?.totalSpent || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
