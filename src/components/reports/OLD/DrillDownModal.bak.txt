// src/components/reports/MonthlyReport/DrillDownModal.tsx
// מבנה 4 רמות: קוד מיון → חשבונות → ספקים → תנועות

import React, { useState, useMemo } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Transaction } from '../../../types/reportTypes';
import { BiurModal } from './BiurModal';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                     'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

interface VendorGroup {
  counterAccountNumber: number;
  counterAccountName: string;
  transactions: Transaction[];
  total: number;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryCode: number | string;
  categoryName: string;
  month: number;
  monthName: string;
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  categoryCode,
  categoryName,
  month,
  monthName,
  transactions,
  formatCurrency
}) => {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorGroup | null>(null);
  const [showBiurModal, setShowBiurModal] = useState(false);

  if (!isOpen) return null;

  // רמה 2: קיבוץ לפי חשבונות
  const accountGroups = useMemo(() => {
    const groups = new Map<number, {
      accountKey: number;
      accountName: string;
      transactions: Transaction[];
      total: number;
    }>();

    transactions.forEach(tx => {
      if (!groups.has(tx.accountKey)) {
        groups.set(tx.accountKey, {
          accountKey: tx.accountKey,
          accountName: tx.accountName,
          transactions: [],
          total: 0
        });
      }
      const group = groups.get(tx.accountKey)!;
      group.transactions.push(tx);
      group.total += tx.amount;
    });

    return Array.from(groups.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total)
    );
  }, [transactions]);

  // רמה 3: קיבוץ לפי ספקים (רק אם נבחר חשבון)
  const vendorGroups = useMemo((): VendorGroup[] => {
    if (!selectedAccount) return [];

    const accountData = accountGroups.find(a => a.accountKey === selectedAccount);
    if (!accountData) return [];

    const groups = new Map<string, VendorGroup>();

    accountData.transactions.forEach(tx => {
      const key = `${tx.counterAccountNumber || 0}_${tx.counterAccountName || 'לא ידוע'}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          counterAccountNumber: tx.counterAccountNumber || 0,
          counterAccountName: tx.counterAccountName || 'לא ידוע',
          transactions: [],
          total: 0
        });
      }
      const group = groups.get(key)!;
      group.transactions.push(tx);
      group.total += tx.amount;
    });

    return Array.from(groups.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total)
    );
  }, [selectedAccount, accountGroups]);

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const selectedAccountData = accountGroups.find(a => a.accountKey === selectedAccount);

  const handleAccountClick = (accountKey: number) => {
    setSelectedAccount(accountKey);
    setSelectedVendor(null);
  };

  const handleVendorClick = (vendor: VendorGroup) => {
    setSelectedVendor(vendor);
    setShowBiurModal(true);
  };

  const handleBack = () => {
    if (selectedVendor) {
      setSelectedVendor(null);
    } else if (selectedAccount) {
      setSelectedAccount(null);
    }
  };

  const handleCloseBiur = () => {
    setShowBiurModal(false);
    setSelectedVendor(null);
  };

  // קביעת כותרת דינמית
  const getTitle = () => {
    if (selectedAccount && selectedVendor) {
      return `רמה 4: תנועות - ${selectedVendor.counterAccountName}`;
    } else if (selectedAccount) {
      return `רמה 3: ספקים - חשבון ${selectedAccount}`;
    } else {
      return `רמה 2: חשבונות - ${categoryName}`;
    }
  };

  const getSubtitle = () => {
    if (selectedAccount && selectedVendor) {
      return `${monthName} | חשבון ${selectedAccount} | ${selectedVendor.transactions.length} תנועות`;
    } else if (selectedAccount) {
      return `${monthName} | ${vendorGroups.length} ספקים | ${selectedAccountData?.transactions.length || 0} תנועות`;
    } else {
      return `${monthName} | ${accountGroups.length} חשבונות | ${transactions.length} תנועות`;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* כותרת */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {getSubtitle()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(selectedAccount || selectedVendor) && (
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <ChevronRight className="w-5 h-5" />
                  חזור
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="סגור"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* תוכן */}
          <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
            {!selectedAccount ? (
              // רמה 2: טבלת חשבונות
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-700">
                      מפתח חשבון
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      שם חשבון
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                      מספר תנועות
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      סכום
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountGroups.map((account, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleAccountClick(account.accountKey)}
                    >
                      <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-blue-600">
                        {account.accountKey}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {account.accountName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-center text-gray-600">
                        {account.transactions.length}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-left font-medium text-black">
                        {formatCurrency(account.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50 sticky bottom-0 border-t-2 border-emerald-400">
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right font-bold text-emerald-800">
                      סה"כ:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-left font-bold text-emerald-800">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : !selectedVendor ? (
              // רמה 3: טבלת ספקים
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-purple-700">
                      ח-ן נגדי
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      שם ספק/לקוח
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                      מספר תנועות
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      סכום
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendorGroups.map((vendor, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => handleVendorClick(vendor)}
                    >
                      <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-purple-600">
                        {vendor.counterAccountNumber || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {vendor.counterAccountName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-center text-gray-600">
                        {vendor.transactions.length}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-left font-medium text-black">
                        {formatCurrency(vendor.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50 sticky bottom-0 border-t-2 border-emerald-400">
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right font-bold text-emerald-800">
                      סה"כ:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-left font-bold text-emerald-800">
                      {formatCurrency(selectedAccountData?.total || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : null}
          </div>
        </div>
      </div>

      {/* רמה 4: BiurModal */}
      {selectedVendor && (
        <BiurModal
          isOpen={showBiurModal}
          data={{
            title: `${categoryName} - חשבון ${selectedAccount} - ${selectedVendor.counterAccountName} - ${monthName}`,
            transactions: selectedVendor.transactions
          }}
          onClose={handleCloseBiur}
          formatCurrency={formatCurrency}
        />
      )}
    </>
  );
};