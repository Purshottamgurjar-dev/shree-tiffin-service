import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Customer Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/users', { params });
      if (res.data?.success) {
        setCustomers(res.data.users || []);
        if (res.data.pagination) {
          setPage(res.data.pagination.page);
          setTotalPages(res.data.pagination.totalPages);
          setTotalCount(res.data.pagination.total);
        }
      } else {
        setError(res.data?.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenCustomerDetail = async (customerId) => {
    setSelectedCustomerId(customerId);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/users/${customerId}`);
      if (res.data?.success) {
        setCustomerDetail(res.data.user);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to load customer profile');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Page Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Customer Directory & Accounts
              </h1>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                Owner Operations
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Lifetime ordering metrics, registered delivery addresses, and customer support actions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchCustomers}
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/admin/dashboard"
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search customers by Name, Email, or Phone Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '13.5px' }}>
              Search Customers
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); fetchCustomers(); }}
                className="btn btn-outline"
                style={{ padding: '9px 14px', fontSize: '13px' }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--status-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Customers Table */}
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" color="var(--primary-700)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Loading customer directory...</div>
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>No Customers Found</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                {search ? `No customer matches the query "${search}".` : 'No registered customers found.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '2px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontWeight: '700',
                    }}>
                      <th style={{ padding: '12px 16px' }}>Customer</th>
                      <th style={{ padding: '12px 16px' }}>Contact</th>
                      <th style={{ padding: '12px 16px' }}>Joined</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Orders (Total / Done / Cancel)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Spent</th>
                      <th style={{ padding: '12px 16px' }}>Last Order</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cust) => {
                      const stats = cust.stats || {};
                      const cleanPhone = (cust.phone || '').replace(/\D/g, '');

                      return (
                        <tr
                          key={cust._id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                              {cust.name}
                            </div>
                            {cust.role === 'owner' && (
                              <span className="badge badge-warning" style={{ fontSize: '10px', marginTop: '2px' }}>
                                Owner
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                            <div>{cust.email}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              {cust.phone || 'No phone'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                            {formatDate(cust.createdAt)}
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalOrders || 0}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                            <span style={{ fontWeight: '700', color: 'var(--veg-800)' }}>{stats.completedOrders || 0}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                            <span style={{ fontWeight: '700', color: 'var(--status-danger)' }}>{stats.cancelledOrders || 0}</span>
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: 'var(--primary-800)' }}>
                            {formatCurrency(stats.totalSpent || 0)}
                          </td>

                          <td style={{ padding: '14px 16px', fontSize: '12.5px' }}>
                            {stats.lastOrder ? (
                              <div>
                                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                  {stats.lastOrder.orderNumber}
                                </div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '11.5px' }}>
                                  {formatDate(stats.lastOrder.date)} • {formatCurrency(stats.lastOrder.total)}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>No orders</span>
                            )}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span className="badge badge-success" style={{ fontSize: '11px' }}>
                              {cust.accountStatus || 'Active'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenCustomerDetail(cust._id)}
                                title="View Customer Profile"
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={13} />
                                <span>Profile</span>
                              </button>

                              {cleanPhone && (
                                <>
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    title="Call Customer"
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '12px', color: '#2563eb' }}
                                  >
                                    <Phone size={13} />
                                  </a>
                                  <a
                                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${cust.name}, contacting you from Shree Tiffin Service.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="WhatsApp Customer"
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '12px', color: '#16a34a' }}
                                  >
                                    <MessageSquare size={13} />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{
                padding: '14px 20px',
                backgroundColor: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                <div>
                  Showing <strong>{customers.length}</strong> of <strong>{totalCount}</strong> customers (Page {page} of {totalPages})
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn btn-outline"
                    style={{ padding: '5px 10px', fontSize: '12px', opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn btn-outline"
                    style={{ padding: '5px 10px', fontSize: '12px', opacity: page >= totalPages ? 0.5 : 1 }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Customer Details Modal */}
        {selectedCustomerId && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}>
            <div className="card" style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    Customer Account Overview
                  </h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
                    Profile details, saved delivery addresses, and recent order history
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedCustomerId(null); setCustomerDetail(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail || !customerDetail ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" color="var(--primary-700)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Loading customer data...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Basic Profile */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', display: 'block' }}>FULL NAME</span>
                      <strong>{customerDetail.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', display: 'block' }}>EMAIL</span>
                      <strong>{customerDetail.email}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', display: 'block' }}>PHONE NUMBER</span>
                      <strong>{customerDetail.phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px', display: 'block' }}>TOTAL LIFETIME SPENT</span>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '15px' }}>{formatCurrency(customerDetail.stats?.totalSpent || 0)}</strong>
                    </div>
                  </div>

                  {/* Saved Delivery Addresses */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
                      Saved Delivery Addresses ({customerDetail.addresses?.length || 0})
                    </h4>
                    {customerDetail.addresses?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No addresses saved yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customerDetail.addresses.map((addr) => (
                          <div
                            key={addr._id}
                            style={{
                              padding: '10px 14px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12.5px',
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ fontWeight: '700', color: 'var(--primary-800)', textTransform: 'uppercase', fontSize: '11px' }}>
                              [{addr.label || 'Home'}]
                            </span>{' '}
                            <strong>{addr.fullName} ({addr.phone})</strong> — {addr.addressLine1}
                            {addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
                      Recent Orders ({customerDetail.recentOrders?.length || 0})
                    </h4>
                    {customerDetail.recentOrders?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No orders placed yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customerDetail.recentOrders.map((ord) => (
                          <div
                            key={ord._id}
                            style={{
                              padding: '10px 14px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>{ord.orderNumber}</strong>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginLeft: '8px' }}>
                                {formatDate(ord.createdAt)}
                              </span>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {ord.orderStatus} • {ord.paymentMethod} ({ord.paymentStatus})
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'var(--primary-800)' }}>{formatCurrency(ord.total)}</strong>
                              <div>
                                <Link
                                  to={`/admin/orders/${ord._id}`}
                                  onClick={() => setSelectedCustomerId(null)}
                                  style={{ fontSize: '12px', color: 'var(--primary-700)', fontWeight: '700', textDecoration: 'none' }}
                                >
                                  View Order →
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => { setSelectedCustomerId(null); setCustomerDetail(null); }}
                      className="btn btn-secondary"
                      style={{ padding: '8px 20px', fontSize: '13px' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
