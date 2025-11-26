// AccountRow.tsx - שורת חשבון הוצאה/הכנסה (רמה 2)

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { AccountData, BiurData } from './types';
import { VendorRow } from './VendorRow';

interface AccountRowProps {
  account: AccountData;
  onShowBiur: (data: BiurData) => void;
  formatCurrency: (amount: number) => string;
  categoryType: 'income' | 'cogs' | 'operating' | 'financial';
  monthName: string;
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  onShowBiur,
  formatCurrency,
  categoryType,
  monthName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasVendors = account.vendors && account.vendors.length > 0;

  const handleToggle = () => {
    if (hasVendors) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAccountClick = () => {
    onShowBiur({
      title: `חשבון ${account.accountKey} - ${account.accountName} - ${monthName}`,
      transactions: account.transactions
    });
  };

  const handleVendorClick = (vendor: any) => {
    onShowBiur({
      title: `${vendor.counterAccountName} - חשבון ${account.accountKey} - ${monthName}`,
      transactions: vendor.transactions
    });
  };

  return (
    <>
      <tr 
        className="bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
        onClick={handleToggle}
      >
        <td className="border border-gray-200 px-4 py-2 sticky right-0 bg-blue-50">
          <div className="flex items-center gap-2" style={{ paddingRight: '2rem' }}>
            {hasVendors && (
              <div className="flex-shrink-0">
                {isExpanded ? 
                  <Minus className="w-4 h-4 text-blue-600" /> : 
                  <Plus className="w-4 h-4 text-blue-600" />
                }
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAccountClick();
              }}
              className="p-1 hover:bg-blue-200 rounded text-blue-400 hover:text-blue-700"
              title="הצג תנועות"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              רמה 2
            </span>
            <span className="font-medium text-gray-900">
              {account.accountKey}
            </span>
            <span className="text-gray-600">—</span>
            <span className="text-gray-800">
              {account.accountName}
            </span>
            {hasVendors && (
              <span className="text-xs text-gray-500">
                ({account.vendors.length} ספקים)
              </span>
            )}
          </div>
        </td>
        <td 
          className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-800 hover:bg-blue-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleAccountClick();
          }}
        >
          {categoryType === 'income' 
            ? formatCurrency(account.amount)
            : formatCurrency(Math.abs(account.amount))
          }
        </td>
        <td className="border border-gray-200 px-2 py-2 text-center">
          <span className="text-xs text-gray-400">📊</span>
        </td>
      </tr>

      {/* רמה 3: ספקים */}
      {isExpanded && account.vendors.map((vendor, idx) => (
        <VendorRow
          key={`${vendor.counterAccountNumber}-${idx}`}
          vendor={vendor}
          onShowBiur={() => handleVendorClick(vendor)}
          formatCurrency={formatCurrency}
          categoryType={categoryType}
        />
      ))}
    </>
  );
};
