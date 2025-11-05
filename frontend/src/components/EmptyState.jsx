import React from 'react';
import { Button } from './ui/button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(0, 137, 123, 0.1)' }}
      >
        {Icon && <Icon className="w-12 h-12 text-teal-600" />}
      </div>
      <h3 className="text-2xl font-bold mb-2" style={{ color: '#004D40' }}>
        {title}
      </h3>
      <p className="text-center max-w-md mb-6" style={{ color: '#00695C' }}>
        {description}
      </p>
      {action && actionLabel && (
        <Button
          onClick={action}
          style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white' }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
