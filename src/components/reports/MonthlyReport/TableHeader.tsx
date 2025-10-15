// src/components/reports/MonthlyReport/TableHeader.tsx

import React from 'react';
import { MONTH_NAMES } from '../../../constants/reportConstants';

interface TableHeaderProps {
  months: number[];
}

export const TableHeader: React.FC<TableHeaderProps> = ({ months }) => {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <th className="border border-gray-300 px-4 py-3 text-right font-semibold min-w-[250px] sticky right-0 bg-gradient-to-r from-emerald-50 to-teal-50">
          קטגוריה
        </th>
        {months.map(m => (
          <th 
            key={m} 
            className="border border-gray-300 px-3 py-3 text-center font-semibold min-w-[120px]"
          >
            {MONTH_NAMES[m - 1]}
          </th>
        ))}
        <th className="border border-gray-300 px-3 py-3 text-center font-semibold min-w-[130px]">
          סה"כ
        </th>
        <th className="border border-gray-300 px-2 py-3 w-12">
          🔎
        </th>
      </tr>
    </thead>
  );
};