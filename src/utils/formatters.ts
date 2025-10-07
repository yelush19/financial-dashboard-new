// src/utils/formatters.ts
export const numberFormat = (num: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const percentFormat = (value: number, base: number = 100): string => {
  if (base === 0) return "0%";
  return `${(value / base * 100).toFixed(1)}%`;
};

export const dateFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (error) {
    return dateStr;
  }
};