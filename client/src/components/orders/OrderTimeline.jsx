import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bike, 
  CheckCircle2, 
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { formatDate } from '../../utils';

const WORKFLOW_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: Clock, desc: 'Received by kitchen' },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle, desc: 'Accepted by cook' },
  { key: 'Preparing', label: 'Cooking & Packing', icon: ChefHat, desc: 'Fresh in stainless tiffins' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Bike, desc: 'Rider is on the way' },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Hot meal received' },
];

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.orderStatus === 'Cancelled';
  const currentStatusIndex = WORKFLOW_STEPS.findIndex((s) => s.key === order.orderStatus);

  // Map statusHistory for quick timestamp lookup
  const historyMap = {};
  if (Array.isArray(order.statusHistory)) {
    order.statusHistory.forEach((h) => {
      historyMap[h.status] = h;
    });
  }

  if (isCancelled) {
    const cancelInfo = historyMap['Cancelled'] || {};
    return (
      <div style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--status-danger)', marginBottom: '8px' }}>
          <XCircle size={22} />
          <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>This Order Was Cancelled</h3>
        </div>
        <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          <strong>Reason:</strong> {order.cancellationReason || cancelInfo.note || 'No reason provided'}
        </p>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Cancelled on {formatDate(order.cancelledAt || cancelInfo.changedAt || order.updatedAt)}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 'clamp(16px, 4vw, 24px)',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>
        Live Order Tracker
      </h3>

      <div
        className="timeline-container-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${WORKFLOW_STEPS.length}, 1fr)`,
          position: 'relative',
          gap: '12px',
        }}
      >
        {WORKFLOW_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = currentStatusIndex > idx;
          const isCurrent = currentStatusIndex === idx;
          const historyEntry = historyMap[step.key];

          const circleColor = isCompleted
            ? 'var(--veg-600)'
            : isCurrent
            ? 'var(--primary-600)'
            : 'var(--text-muted)';

          const circleBg = isCompleted
            ? 'var(--veg-50)'
            : isCurrent
            ? 'var(--primary-50)'
            : 'var(--bg-subtle)';

          const borderColor = isCompleted
            ? 'var(--veg-500)'
            : isCurrent
            ? 'var(--primary-500)'
            : 'var(--border-color)';

          return (
            <div
              key={step.key}
              className="timeline-step-row"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Step Circle */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  borderRadius: '50%',
                  backgroundColor: circleBg,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: circleColor,
                  marginBottom: '10px',
                  boxShadow: isCurrent ? '0 0 0 4px var(--primary-100)' : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? <CheckCircle2 size={22} /> : <StepIcon size={20} />}
              </div>

              {/* Step Info Content */}
              <div className="timeline-step-content">
                {/* Title & Desc */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: isCurrent || isCompleted ? '700' : '500',
                  color: isCurrent ? 'var(--primary-900)' : isCompleted ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  marginBottom: '3px',
                }}>
                  {step.label}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                  {step.desc}
                </div>

                {/* Timestamp if reached */}
                {historyEntry && (
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--primary-700)',
                    fontWeight: '600',
                    marginTop: '4px',
                    display: 'inline-block',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    {new Date(historyEntry.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
