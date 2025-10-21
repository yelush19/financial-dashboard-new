// src/components/reports/MonthlyReport/CategoryRow.tsx

import React from 'react';
import { FileText, Plus, Minus } from 'lucide-react';
import { CategoryData } from '../../../types/reportTypes';

interface CategoryRowProps {
  category: CategoryData;
  months: number[];
  isExpanded: boolean;
  onToggle: () => void;
  onShowBiur: (month?: number) => void;
  formatCurrency: (amount: number) => string;
  colorClass?: string;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  months,
  isExpanded,
  onToggle,
  onShowBiur,
  formatCurrency,
  colorClass = ''
}) => {
  const hasVendors = Boolean(category.vendors && category.vendors.length > 0);
  const displayCode = typeof category.code === 'number' ? category.code : '600';

  return (
    <tr 
      className={`hover:bg-gray-50 cursor-pointer ${colorClass}`}
      onClick={onToggle}
    >
      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
        <div className="flex items-center gap-2">
          {hasVendors && (
            isExpanded ? 
              <Minus className="w-4 h-4 text-gray-600" /> : 
              <Plus className="w-4 h-4 text-gray-600" />
          )}
          <span className="font-medium">{displayCode} - {category.name}</span>
          {hasVendors && category.vendors && (
            <span className="text-xs text-gray-500">({category.vendors.length})</span>
          )}
        </div>
      </td>
      {months.map(m => (
        <td 
          key={m} 
          className="border border-gray-300 px-3 py-2 text-center font-medium hover:bg-emerald-50 cursor-pointer transition-colors"
          onClick={(e) => { 
            e.stopPropagation(); 
            onShowBiur(m); 
          }}
        >
          {category.type === 'income' 
            ? formatCurrency(category.data[m] || 0)
            : formatCurrency(Math.abs(category.data[m] || 0))
          }
        </td>
      ))}
      <td className="border border-gray-300 px-3 py-2 text-center font-bold">
        {category.type === 'income'
          ? formatCurrency(category.data.total)
          : formatCurrency(Math.abs(category.data.total))
        }
      </td>
      <td className="border border-gray-300 px-2 py-2 text-center">
        <FileText 
          className="w-4 h-4 text-gray-600 mx-auto cursor-pointer hover:text-gray-800"
          onClick={(e) => { 
            e.stopPropagation(); 
            onShowBiur(); 
          }}
        />
      </td>
    </tr>
  );
};