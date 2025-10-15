// src/components/reports/MonthlyReport/StatsCards.tsx

import React from 'react';
import { ProcessedMonthlyData, Inventory, Adjustments2024 } from '../../../types/reportTypes';
import { CARD_COLORS } from '../../../constants/reportConstants';

interface StatsCardsProps {
  monthlyData: ProcessedMonthlyData;
  openingInventory: Inventory;
  closingInventory: Inventory;
  adjustments2024: Adjustments2024;
  formatCurrency: (amount: number) => string;
  getAdjustmentValue: (categoryCode: string, month: number) => number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  monthlyData,
  openingInventory,
  closingInventory,
  adjustments2024,
  formatCurrency,
  getAdjustmentValue
}) => {
  // חישוב עלות המכר עם התאמות
  const calculateCogsWithAdjustments = () => {
    return (
      Math.abs(monthlyData.totals.cogs.total) +
      Object.values(openingInventory).reduce((a, b) => a + b, 0) -
      Object.values(closingInventory).reduce((a, b) => a + b, 0) +
      monthlyData.categories
        .filter(c => c.type === 'cogs')
        .reduce((sum, cat) => {
          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
        }, 0)
    );
  };

  // חישוב הוצאות תפעול עם התאמות
  const calculateOperatingWithAdjustments = () => {
    return (
      Math.abs(monthlyData.totals.operating.total) +
      monthlyData.categories
        .filter(c => c.type === 'operating')
        .reduce((sum, cat) => {
          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
        }, 0)
    );
  };

  // חישוב הוצאות מימון עם התאמות
  const calculateFinancialWithAdjustments = () => {
    return (
      Math.abs(monthlyData.totals.financial.total) +
      monthlyData.categories
        .filter(c => c.type === 'financial')
        .reduce((sum, cat) => {
          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
        }, 0)
    );
  };

  const cogsWithAdjustments = calculateCogsWithAdjustments();
  const operatingWithAdjustments = calculateOperatingWithAdjustments();
  const financialWithAdjustments = calculateFinancialWithAdjustments();

  const grossProfit = monthlyData.totals.revenue.total - cogsWithAdjustments;
  const operatingProfit = grossProfit - operatingWithAdjustments;
  const netProfit = operatingProfit - financialWithAdjustments;

  // נתונים מקוריים (לפני התאמות)
  const originalCogs = Math.abs(monthlyData.totals.cogs.total);
  const originalOperatingProfit = monthlyData.totals.revenue.total - originalCogs - Math.abs(monthlyData.totals.operating.total);
  const originalNetProfit = originalOperatingProfit - Math.abs(monthlyData.totals.financial.total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* כרטיס הכנסות */}
      <div className={`p-4 rounded-lg border ${CARD_COLORS.revenue}`}>
        <div className="text-sm text-gray-600 mb-1">סה"כ הכנסות</div>
        <div className="text-2xl font-bold text-green-700 mb-2">
          {formatCurrency(monthlyData.totals.revenue.total)}
        </div>
        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
          ללא שינויים
        </div>
      </div>

      {/* כרטיס עלות המכר */}
      <div className={`p-5 rounded-lg border ${CARD_COLORS.cogs}`}>
        <div className="text-sm text-gray-600 mb-1">עלות המכר</div>
        <div className="text-2xl font-bold text-orange-700 mb-3">
          {formatCurrency(cogsWithAdjustments)}
        </div>
        <div className="bg-orange-100 px-3 py-2 rounded space-y-1">
          <div className="flex justify-between text-xs text-orange-700">
            <span className="font-medium">מקורי:</span>
            <span className="font-bold">{formatCurrency(originalCogs)}</span>
          </div>
          <div className="flex justify-between text-xs text-orange-800 border-t border-orange-300 pt-1">
            <span className="font-medium">עם התאמות:</span>
            <span className="font-bold">{formatCurrency(cogsWithAdjustments)}</span>
          </div>
        </div>
      </div>

      {/* כרטיס רווח תפעולי */}
      <div className={`p-5 rounded-lg border ${CARD_COLORS.opProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח תפעולי</div>
        <div className="text-2xl font-bold text-emerald-700 mb-3">
          {formatCurrency(operatingProfit)}
        </div>
        <div className="bg-emerald-100 px-3 py-2 rounded space-y-1">
          <div className="flex justify-between text-xs text-emerald-700">
            <span className="font-medium">מקורי:</span>
            <span className="font-bold">{formatCurrency(originalOperatingProfit)}</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-800 border-t border-emerald-300 pt-1">
            <span className="font-medium">עם התאמות:</span>
            <span className="font-bold">{formatCurrency(operatingProfit)}</span>
          </div>
        </div>
      </div>

      {/* כרטיס רווח נקי */}
      <div className={`p-5 rounded-lg border ${CARD_COLORS.netProfit}`}>
        <div className="text-sm text-gray-600 mb-1">רווח נקי</div>
        <div className="text-2xl font-bold text-teal-700 mb-3">
          {formatCurrency(netProfit)}
        </div>
        <div className="bg-teal-100 px-3 py-2 rounded space-y-1">
          <div className="flex justify-between text-xs text-teal-700">
            <span className="font-medium">מקורי:</span>
            <span className="font-bold">{formatCurrency(originalNetProfit)}</span>
          </div>
          <div className="flex justify-between text-xs text-teal-800 border-t border-teal-300 pt-1">
            <span className="font-medium">עם התאמות:</span>
            <span className="font-bold">{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};