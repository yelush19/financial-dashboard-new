// VendorRow.tsx - שורת ספק/לקוח (רמה 3)

import React from 'react';
import { Plus } from 'lucide-react';
import { VendorData } from './types';

interface VendorRowProps {
  vendor: VendorData;
  onShowBiur: () => void;
  formatCurrency: (amount: number) => string;
  categoryType: 'income' | 'cogs' | 'operating' | 'financial';
}

export const VendorRow: React.FC<VendorRowProps> = ({
  vendor,
  onShowBiur,
  formatCurrency,
  categoryType
}) => {
  return (
    <tr className="bg-purple-50 hover:bg-purple-100 transition-colors">
      <td className="border border-gray-200 px-4 py-2 sticky right-0 bg-purple-50">
        <div className="flex items-center gap-2" style={{ paddingRight: '4rem' }}>
          <button
            onClick={onShowBiur}
            className="p-1 hover:bg-purple-200 rounded text-purple-400 hover:text-purple-700"
            title="הצג תנועות"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
            רמה 3
          </span>
          <span className="text-gray-700 text-sm">
            {vendor.counterAccountName}
            {vendor.counterAccountNumber !== 0 && (
              <span className="text-gray-500 text-xs mr-1">
                ({vendor.counterAccountNumber})
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="border border-gray-200 px-3 py-2 text-center text-gray-700 font-medium cursor-pointer hover:bg-purple-200"
          onClick={onShowBiur}>
        {categoryType === 'income' 
          ? formatCurrency(vendor.amount)
          : formatCurrency(Math.abs(vendor.amount))
        }
      </td>
      <td className="border border-gray-200"></td>
    </tr>
  );
};
