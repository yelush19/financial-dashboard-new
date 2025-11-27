// StatsCards.tsx - כרטיסי סיכום למעלה

import React from 'react';
import { SingleMonthSummary } from './types';

interface StatsCardsProps {
  summary: SingleMonthSummary;
  formatCurrency: (amount: number) => string;
}

const CARD_COLORS = {
  revenue: 'bg-green-50 border-green-200',
  grossProfit: 'bg-emerald-50 border-emerald-200',
  opProfit: 'bg-teal-50 border-teal-200',
  netProfit: 'bg-cyan-50 border-cyan-200'
};

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* הכנסות */}
      <div className={`p-4 rounded-lg border-2 ${CARD_COLORS.revenue}`}>
        <div className="text-sm text-gray-600 mb-1">סה"כ הכנסות</div>
        <div className="text-2xl font-bold text-green-700">
          {formatCurrency(summary.revenue)}
        </div>
        <div className="text-xs text-green-600 mt-2">
          ללא שינויים
        </div>
      </div>

      {/* רווח גולמי */}
      <div className={`p-4 rounded-lg border-2 ${CARD_COLORS.grossProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח גולמי</div>
        <div className="text-2xl font-bold text-emerald-700">
          {formatCurrency(summary.grossProfit)}
        </div>
        <div className="text-xs text-gray-600 mt-2">
          אחרי עלות מכר
        </div>
      </div>

      {/* רווח תפעולי */}
      <div className={`p-4 rounded-lg border-2 ${CARD_COLORS.opProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח תפעולי</div>
        <div className="text-2xl font-bold text-teal-700">
          {formatCurrency(summary.operatingProfit)}
        </div>
        <div className="text-xs text-gray-600 mt-2">
          אחרי הוצאות תפעול
        </div>
      </div>

      {/* רווח נקי */}
      <div className={`p-4 rounded-lg border-2 ${CARD_COLORS.netProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח נקי</div>
        <div className="text-2xl font-bold text-cyan-700">
          {formatCurrency(summary.netProfit)}
        </div>
        <div className="text-xs text-gray-600 mt-2">
          שורה תחתונה
        </div>
      </div>
    </div>
  );
};
