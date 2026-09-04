import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bike, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

const STATUS_CONFIG = {
  Pending: {
    label: 'Order Placed',
    color: '#b45309',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: Clock,
  },
  Confirmed: {
    label: 'Confirmed',
    color: '#1d4ed8',
    bgColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    icon: CheckCircle,
  },
  Preparing: {
    label: 'Preparing Fresh',
    color: '#7e22ce',
    bgColor: 'rgba(126, 34, 206, 0.12)',
    borderColor: 'rgba(126, 34, 206, 0.3)',
    icon: ChefHat,
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    color: '#c2410c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    icon: Bike,
  },
  Delivered: {
    label: 'Delivered',
    color: '#15803d',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    icon: CheckCircle2,
  },
  Cancelled: {
    label: 'Cancelled',
    color: '#b91c1c',
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    icon: XCircle,
  },
};

export default function OrderStatusBadge({ status, size = 'medium' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const IconComponent = config.icon;

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const padding = isSmall ? '3px 8px' : isLarge ? '6px 14px' : '4px 10px';
  const fontSize = isSmall ? '11px' : isLarge ? '13.5px' : '12px';
  const iconSize = isSmall ? 12 : isLarge ? 16 : 14;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        fontSize,
        fontWeight: '700',
        borderRadius: '9999px',
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <IconComponent size={iconSize} style={{ flexShrink: 0 }} />
      <span>{config.label}</span>
    </span>
  );
}
