import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  ChefHat,
  XCircle,
  CreditCard,
  Banknote,
  Info,
  CheckCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import { formatDate } from '../utils';
import SEO from '../components/SEO';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ORDERS, PAYMENTS
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const params = { page: pageNum, limit: 15 };
      if (filter === 'UNREAD') params.unreadOnly = true;

      const res = await notificationService.getNotifications(params);
      if (res.success) {
        if (append) {
          setNotifications((prev) => [...prev, ...(res.notifications || [])]);
        } else {
          setNotifications(res.notifications || []);
        }
        setUnreadCount(res.unreadCount || 0);
        setHasMore(pageNum < (res.pagination?.totalPages || 1));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false);
  }, [filter]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter in-memory for category tabs
  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'ORDERS') {
      return (
        n.type.startsWith('ORDER_') ||
        ['ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_PREPARING', 'ORDER_OUT_FOR_DELIVERY', 'ORDER_DELIVERED', 'ORDER_CANCELLED'].includes(n.type)
      );
    }
    if (filter === 'PAYMENTS') {
      return ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'COD_COLLECTED'].includes(n.type);
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
        return <Package size={20} color="#ea580c" />;
      case 'ORDER_CONFIRMED':
        return <CheckCircle2 size={20} color="#16a34a" />;
      case 'ORDER_PREPARING':
        return <ChefHat size={20} color="#ca8a04" />;
      case 'ORDER_OUT_FOR_DELIVERY':
        return <Truck size={20} color="#0284c7" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle2 size={20} color="#16a34a" />;
      case 'ORDER_CANCELLED':
        return <XCircle size={20} color="#dc2626" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard size={20} color="#16a34a" />;
      case 'PAYMENT_FAILED':
        return <AlertCircle size={20} color="#dc2626" />;
      case 'COD_COLLECTED':
        return <Banknote size={20} color="#16a34a" />;
      default:
        return <Info size={20} color="#4b5563" />;
    }
  };

  return (
    <div className="page-bottom-nav-pad" style={{ backgroundColor: 'var(--bg-cream)', minHeight: 'calc(100vh - 76px)', padding: '36px 0 60px' }}>
      <SEO title="Notifications" noindex={true} />
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary-800)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
              Real-time kitchen updates, delivery milestones, and payment confirmations
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--primary-900)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNREAD', label: `Unread (${unreadCount})` },
            { key: 'ORDERS', label: 'Orders' },
            { key: 'PAYMENTS', label: 'Payments' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: filter === tab.key ? '1px solid var(--primary-800)' : '1px solid var(--border-light)',
                backgroundColor: filter === tab.key ? 'var(--primary-50)' : '#ffffff',
                color: filter === tab.key ? 'var(--primary-900)' : 'var(--text-secondary)',
                fontWeight: filter === tab.key ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading && notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', color: 'var(--primary-700)' }} />
            <p>Loading your notifications...</p>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '50px 24px',
              textAlign: 'center',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-50)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Bell size={28} color="var(--primary-700)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No notifications yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 20px' }}>
              {filter === 'UNREAD'
                ? "You're all caught up! There are no unread notifications right now."
                : 'Whenever you place a fresh tiffin order or receive a delivery milestone, updates will appear here.'}
            </p>
            <Link
              to="/menu"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: 'var(--primary-800)',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Browse Today's Menu
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedNotifications.map((n) => (
              <div
                key={n._id}
                style={{
                  backgroundColor: n.isRead ? '#ffffff' : 'var(--primary-50)',
                  border: n.isRead ? '1px solid var(--border-subtle)' : '1px solid var(--primary-200)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Icon avatar */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: n.isRead ? 'var(--bg-subtle)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content body */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h4
                      style={{
                        margin: '0 0 4px',
                        fontSize: '15px',
                        fontWeight: n.isRead ? '600' : '800',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 10px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                    }}
                  >
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {n.metadata?.orderId && (
                      <Link
                        to={`/orders/${n.metadata.orderId}`}
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'var(--primary-800)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>View Order Details</span>
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Unread indicator dot */}
                {!n.isRead && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-800)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                    title="Unread"
                  />
                )}
              </div>
            ))}

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchNotifications(next, true);
                  }}
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Loading...' : 'Load More Notifications'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
