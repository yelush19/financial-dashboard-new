// CategoryRow.tsx - שורת קטגוריה (רמה 1)

import React, { useState } from 'react';
import { Plus, Minus, FileText } from 'lucide-react';
import { CategoryData, BiurData } from './types';
import { AccountRow } from './AccountRow';

interface CategoryRowProps {
  category: CategoryData;
  onShowBiur: (data: BiurData) => void;
  formatCurrency: (amount: number) => string;
  monthName: string;
  totalRevenue: number; // להצגת אחוזים
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  onShowBiur,
  formatCurrency,
  monthName,
  totalRevenue
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAccounts = category.accounts && category.accounts.length > 0;

  // חישוב אחוז מהכנסות
  const percentage = totalRevenue > 0 ? (Math.abs(category.amount) / totalRevenue * 100) : 0;

  const handleToggle = () => {
    if (hasAccounts) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCategoryClick = () => {
    onShowBiur({
      title: `${category.name} - ${monthName}`,
      transactions: category.transactions
    });
  };

  const displayCode = typeof category.code === 'number' ? category.code : 
                      category.code === 'income_site' ? '600 - אתר' :
                      category.code === 'income_superpharm' ? '600 - סופרפארם' : '600';

  return (
    <>
      <tr 
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={handleToggle}
      >
        <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
          <div className="flex items-center gap-2">
            {hasAccounts && (
              isExpanded ? 
                <Minus className="w-4 h-4 text-gray-600" /> : 
                <Plus className="w-4 h-4 text-gray-600" />
            )}
            <span className="font-medium">{displayCode} - {category.name}</span>
            {hasAccounts && (
              <span className="text-xs text-gray-500">({category.accounts.length} חשבונות)</span>
            )}
          </div>
        </td>
        <td 
          className="border border-gray-300 px-3 py-2 text-center font-medium hover:bg-emerald-50 cursor-pointer transition-colors"
          onClick={(e) => { 
            e.stopPropagation(); 
            handleCategoryClick(); 
          }}
        >
          {category.type === 'income' 
            ? formatCurrency(category.amount)
            : formatCurrency(Math.abs(category.amount))
          }
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
          {percentage.toFixed(1)}%
        </td>
        <td className="border border-gray-300 px-2 py-2 text-center">
          <FileText 
            className="w-4 h-4 text-gray-600 mx-auto cursor-pointer hover:text-gray-800"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleCategoryClick(); 
            }}
          />
        </td>
      </tr>

      {/* רמה 2: חשבונות */}
      {isExpanded && category.accounts.map((account, idx) => (
        <AccountRow
          key={`${account.accountKey}-${idx}`}
          account={account}
          onShowBiur={onShowBiur}
          formatCurrency={formatCurrency}
          categoryType={category.type}
          monthName={monthName}
        />
      ))}
    </>
  );
};
