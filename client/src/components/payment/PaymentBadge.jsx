import React from 'react';
import { 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

export default function PaymentBadge({ method, status, showBoth = true, size = 'medium' }) {
  const isSmall = size === 'small';
  const padding = isSmall ? '2px 8px' : '4px 10px';
  const fontSize = isSmall ? '11px' : '12.5px';
  const iconSize = isSmall ? 12 : 14;

  const getMethodBadge = () => {
    if (method === 'COD') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding,
            fontSize,
            fontWeight: '700',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            color: '#b45309',
            border: '1px solid rgba(217, 119, 6, 0.3)',
          }}
        >
          <Banknote size={iconSize} />
          <span>Cash on Delivery</span>
        </span>
      );
    }

    if (method === 'ONLINE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding,
            fontSize,
            fontWeight: '700',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            color: '#1d4ed8',
            border: '1px solid rgba(37, 99, 235, 0.3)',
          }}
        >
          <CreditCard size={iconSize} />
          <span>Online (Razorpay)</span>
        </span>
      );
    }

    return null;
  };

  const getStatusBadge = () => {
    if (status === 'Paid') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding,
            fontSize,
            fontWeight: '700',
            borderRadius: '9999px',
            backgroundColor: 'rgba(22, 163, 74, 0.12)',
            color: '#15803d',
            border: '1px solid rgba(22, 163, 74, 0.3)',
          }}
        >
          <CheckCircle2 size={iconSize} />
          <span>Paid</span>
        </span>
      );
    }

    if (status === 'Pending') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding,
            fontSize,
            fontWeight: '700',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#b45309',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <Clock size={iconSize} />
          <span>Pending</span>
        </span>
      );
    }

    if (status === 'Failed') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding,
            fontSize,
            fontWeight: '700',
            borderRadius: '9999px',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            color: '#b91c1c',
            border: '1px solid rgba(220, 38, 38, 0.3)',
          }}
        >
          <XCircle size={iconSize} />
          <span>Failed</span>
        </span>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {method && getMethodBadge()}
      {status && getStatusBadge()}
    </div>
  );
}
