import { X } from 'lucide-react';
import { Transaction } from '../../utils/parsers';

// פלטת צבעים של ליתאי
const LITAY = {
  primaryDark: '#2d5f3f',
  primary: '#528163',
  primaryLight: '#8dd1bb',
  neutralDark: '#2d3436',
  neutralMedium: '#636e72',
  neutralLight: '#b2bec3',
  neutralBg: '#f5f6fa',
  white: '#ffffff',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  accountNumber: string;
  accountName: string;
  transactions: Transaction[];
  totalAmount: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  accountNumber,
  accountName,
  transactions,
  totalAmount
}: ModalProps) {
  if (!isOpen) return null;

  // פורמט מספר עם פסיקים
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  // פורמט תאריך
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return dateStr;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      style={{ fontFamily: 'Assistant, Heebo, Arial Hebrew, sans-serif' }}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRight: `6px solid ${LITAY.primary}` }}
      >
        {/* Header */}
        <div
          className="px-8 py-6 rounded-t-2xl border-b-2"
          style={{
            background: `linear-gradient(135deg, ${LITAY.primary} 0%, ${LITAY.primaryDark} 100%)`,
            borderColor: LITAY.primaryLight,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <div className="flex items-center gap-4 text-white/90">
                <span className="text-sm font-semibold">
                  חשבון {accountNumber}
                </span>
                <span className="text-sm">•</span>
                <span className="text-sm">{accountName}</span>
                <span className="text-sm">•</span>
                <span className="text-sm">{transactions.length} טרנזקציות</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center backdrop-blur-md border border-white/30 hover:scale-110 active:scale-95"
              aria-label="סגור"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold" style={{ color: LITAY.neutralMedium }}>
                אין טרנזקציות להצגה
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: LITAY.neutralBg }}>
                <tr>
                  <th
                    className="px-4 py-3 text-right font-bold text-sm border-b-2"
                    style={{ color: LITAY.primaryDark, borderColor: LITAY.primary }}
                  >
                    תאריך
                  </th>
                  <th
                    className="px-4 py-3 text-right font-bold text-sm border-b-2"
                    style={{ color: LITAY.primaryDark, borderColor: LITAY.primary }}
                  >
                    חשבון נגדי
                  </th>
                  <th
                    className="px-4 py-3 text-right font-bold text-sm border-b-2"
                    style={{ color: LITAY.primaryDark, borderColor: LITAY.primary }}
                  >
                    פרטים
                  </th>
                  <th
                    className="px-4 py-3 text-center font-bold text-sm border-b-2"
                    style={{ color: LITAY.primaryDark, borderColor: LITAY.primary }}
                  >
                    סכום (₪)
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: LITAY.neutralLight }}
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: LITAY.neutralDark }}
                    >
                      {formatDate(transaction.date)}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: LITAY.neutralDark }}
                    >
                      {transaction.accountName || transaction.account}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: LITAY.neutralMedium }}
                    >
                      {transaction.details || '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-center font-bold"
                      style={{
                        color: transaction.amount >= 0 ? LITAY.primary : '#e74c3c',
                        fontFamily: 'Rubik, Arial',
                      }}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatNumber(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer - Summary */}
        <div
          className="px-8 py-5 rounded-b-2xl border-t-2 flex items-center justify-between"
          style={{ backgroundColor: LITAY.neutralBg, borderColor: LITAY.neutralLight }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: LITAY.neutralDark }}>
              סה״כ:
            </span>
            <span className="text-sm" style={{ color: LITAY.neutralMedium }}>
              {transactions.length} טרנזקציות
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: LITAY.neutralDark }}>
              סכום כולל:
            </span>
            <span
              className="text-2xl font-bold"
              style={{
                color: totalAmount >= 0 ? LITAY.primary : '#e74c3c',
                fontFamily: 'Rubik, Arial',
              }}
            >
              ₪{formatNumber(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}