// StatsCards.tsx - כרטיסי סיכום עם צבעי LITAY

import React from 'react';
import { SingleMonthSummary, Inventory, Adjustments2024 } from './types';
import { CARD_COLORS } from './constants';

interface StatsCardsProps {
  summary: SingleMonthSummary;
  selectedMonth: number;
  openingInventory: Inventory;
  closingInventory: Inventory;
  adjustments2024: Adjustments2024;
  formatCurrency: (amount: number) => string;
  getAdjustmentValue: (categoryCode: string, month: number) => number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  summary,
  selectedMonth,
  openingInventory,
  closingInventory,
  adjustments2024,
  formatCurrency,
  getAdjustmentValue
}) => {
  // חישוב עם מלאי והתאמות
  const openingInv = openingInventory[selectedMonth] || 0;
  const closingInv = closingInventory[selectedMonth] || 0;
  
  // התאמות לכל הקטגוריות
  const cogsAdjustments = getAdjustmentValue('800', selectedMonth) + getAdjustmentValue('806', selectedMonth);
  const operatingAdjustments = 
    getAdjustmentValue('801', selectedMonth) +
    getAdjustmentValue('802', selectedMonth) +
    getAdjustmentValue('804', selectedMonth) +
    getAdjustmentValue('805', selectedMonth) +
    getAdjustmentValue('811', selectedMonth);
  const financialAdjustments = 
    getAdjustmentValue('813', selectedMonth) +
    getAdjustmentValue('990', selectedMonth) +
    getAdjustmentValue('991', selectedMonth);

  // חישובים מעודכנים
  const cogsWithInventory = Math.abs(summary.cogs) + openingInv - closingInv + cogsAdjustments;
  const grossProfitAdjusted = summary.revenue - cogsWithInventory;
  const operatingAdjusted = Math.abs(summary.operating) + operatingAdjustments;
  const operatingProfitAdjusted = grossProfitAdjusted - operatingAdjusted;
  const financialAdjusted = Math.abs(summary.financial) + financialAdjustments;
  const netProfitAdjusted = operatingProfitAdjusted - financialAdjusted;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* הכנסות */}
      <div className={`p-4 rounded-lg ${CARD_COLORS.revenue}`}>
        <div className="text-sm text-gray-600 mb-1">סה"כ הכנסות</div>
        <div className="text-2xl font-bold text-green-700">
          {formatCurrency(summary.revenue)}
        </div>
        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-2">
          ללא שינויים
        </div>
      </div>

      {/* רווח גולמי */}
      <div className={`p-4 rounded-lg ${CARD_COLORS.grossProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח גולמי</div>
        <div className="text-2xl font-bold text-emerald-700">
          {formatCurrency(grossProfitAdjusted)}
        </div>
        <div className="bg-emerald-100 px-2 py-1 rounded mt-2 text-xs space-y-1">
          <div className="flex justify-between text-emerald-700">
            <span>מקורי:</span>
            <span className="font-bold">{formatCurrency(summary.grossProfit)}</span>
          </div>
          <div className="flex justify-between text-emerald-800 border-t border-emerald-300 pt-1">
            <span>מעודכן:</span>
            <span className="font-bold">{formatCurrency(grossProfitAdjusted)}</span>
          </div>
        </div>
      </div>

      {/* רווח תפעולי */}
      <div className={`p-4 rounded-lg ${CARD_COLORS.opProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח תפעולי</div>
        <div className="text-2xl font-bold text-teal-700">
          {formatCurrency(operatingProfitAdjusted)}
        </div>
        <div className="bg-teal-100 px-2 py-1 rounded mt-2 text-xs space-y-1">
          <div className="flex justify-between text-teal-700">
            <span>מקורי:</span>
            <span className="font-bold">{formatCurrency(summary.operatingProfit)}</span>
          </div>
          <div className="flex justify-between text-teal-800 border-t border-teal-300 pt-1">
            <span>מעודכן:</span>
            <span className="font-bold">{formatCurrency(operatingProfitAdjusted)}</span>
          </div>
        </div>
      </div>

      {/* רווח נקי */}
      <div className={`p-4 rounded-lg ${CARD_COLORS.netProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח נקי</div>
        <div className="text-2xl font-bold text-cyan-700">
          {formatCurrency(netProfitAdjusted)}
        </div>
        <div className="bg-cyan-100 px-2 py-1 rounded mt-2 text-xs space-y-1">
          <div className="flex justify-between text-cyan-700">
            <span>מקורי:</span>
            <span className="font-bold">{formatCurrency(summary.netProfit)}</span>
          </div>
          <div className="flex justify-between text-cyan-800 border-t border-cyan-300 pt-1">
            <span>מעודכן:</span>
            <span className="font-bold">{formatCurrency(netProfitAdjusted)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
