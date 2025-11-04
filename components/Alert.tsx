// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from './Icons';

type AlertType = 'info' | 'warning' | 'success';

interface AlertProps {
  type: AlertType;
  message: React.ReactNode;
  className?: string;
}

const alertStyles: Record<AlertType, { container: string; icon: string; text: string }> = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-700',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    text: 'text-green-700',
  },
};

const icons: Record<AlertType, React.ReactElement> = {
  info: <InformationCircleIcon className="w-5 h-5" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  success: <CheckCircleIcon className="w-5 h-5" />,
};

export const Alert: React.FC<AlertProps> = ({ type, message, className = '' }) => {
  const styles = alertStyles[type];
  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-md border ${styles.container} ${className}`}>
      <div className={`flex-shrink-0 ${styles.icon}`}>
        {Icon}
      </div>
      <div className={`text-sm ${styles.text} break-words min-w-0`}>
        {message}
      </div>
    </div>
  );
};