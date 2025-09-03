import React from 'react';
import { DollarSign, ShoppingBag, Package } from 'lucide-react';

const AnalyticsCard = ({ title, value, type, color }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = () => {
    switch (color) {
      case 'green':
        return <DollarSign className="h-8 w-8 text-green-500" />;
      case 'blue':
        return <ShoppingBag className="h-8 w-8 text-blue-500" />;
      case 'purple':
        return <Package className="h-8 w-8 text-purple-500" />;
      default:
        return <DollarSign className="h-8 w-8 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case 'green':
        return 'border-green-500';
      case 'blue':
        return 'border-blue-500';
      case 'purple':
        return 'border-purple-500';
      default:
        return 'border-gray-500';
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'green':
        return 'text-green-600';
      case 'blue':
        return 'text-blue-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${getBorderColor()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${getTextColor()}`}>
            {type === 'currency' ? formatCurrency(value) : value.toLocaleString()}
          </p>
        </div>
        {getIcon()}
      </div>
    </div>
  );
};

export default AnalyticsCard;