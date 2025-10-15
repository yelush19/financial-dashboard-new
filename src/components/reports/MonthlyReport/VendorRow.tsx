// src/components/reports/MonthlyReport/VendorRow.tsx

import React from 'react';
import { FileText } from 'lucide-react';
import { VendorData, CategoryData } from '../../../types/reportTypes';

interface VendorRowProps {
  vendor: VendorData;
  category: CategoryData;
  months: number[];
  onShowBiur: (month?: number) => void;
  formatCurrency: (amount: number) => string;
  bgColor?: string;
}

export const VendorRow: React.FC<VendorRowProps> = ({
  vendor,
  category,
  months,
  onShowBiur,
  formatCurrency,
  bgColor = 'bg-gray-50'
}) => {
  return (
    <tr className={bgColor}>
      <td className={`border border-gray-300 px-8 py-2 text-sm text-gray-700 sticky right-0 ${bgColor}`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">├─</span>
          <span>{vendor.name}</span>
        </div>
      </td>
      {months.map(m => (
        <td 
          key={m} 
          className="border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-100 cursor-pointer"
          onClick={() => onShowBiur(m)}
        >
          {category.type === 'income'
            ? formatCurrency(vendor.data[m] || 0)
            : formatCurrency(Math.abs(vendor.data[m] || 0))
          }
        </td>
      ))}
      <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
        {category.type === 'income'
          ? formatCurrency(vendor.data.total)
          : formatCurrency(Math.abs(vendor.data.total))
        }
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center">
        <FileText 
          className="w-3 h-3 text-gray-600 mx-auto cursor-pointer hover:text-gray-800"
          onClick={() => onShowBiur()}
        />
      </td>
    </tr>
  );
};