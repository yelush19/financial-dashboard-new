// CategoryRow.tsx - שורת קטגוריה (רמה 1)
// הכנסות: ללא אפשרות לפתיחה, רק סיכום
// שאר הקטגוריות: עם drill-down מלא

import React, { useState } from 'react';
import { Plus, Minus, FileText } from 'lucide-react';
import { CategoryData, BiurData } from './types';
import { AccountRow } from './AccountRow';

interface CategoryRowProps {
  category: CategoryData;
  onShowBiur: (data: BiurData) => void;
  formatCurrency: (amount: number) => string;
  monthName: string;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  onShowBiur,
  formatCurrency,
  monthName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAccounts = category.accounts && category.accounts.length > 0;
  
  // 🔒 הכנסות: ללא אפשרות לפתיחה
  const isIncome = category.type === 'income';
  const canExpand = !isIncome && hasAccounts;

  const handleToggle = () => {
    if (canExpand) {
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
            {/* רק אם אפשר להרחיב (לא הכנסות) */}
            {canExpand && (
              isExpanded ? 
                <Minus className="w-4 h-4 text-gray-600" /> : 
                <Plus className="w-4 h-4 text-gray-600" />
            )}
            {/* אם הכנסות - רווח קטן במקום האייקון */}
            {isIncome && <span className="w-4"></span>}
            
            <span className="font-medium">{displayCode} - {category.name}</span>
            
            {/* רק למי שיש חשבונות ולא הכנסות */}
            {canExpand && (
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

      {/* רמה 2: חשבונות - רק אם לא הכנסות ומורחב */}
      {isExpanded && !isIncome && category.accounts.map((account, idx) => (
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
