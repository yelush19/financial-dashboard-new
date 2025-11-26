// constants.ts - קבועים וצבעים למערכת

// צבעי LITAY - פלטת הצבעים הרשמית
export const LITAY_COLORS = {
  primaryDark: '#2d5f3f',
  primary: '#528163',
  primaryLight: '#8dd1bb',
  darkGreen: '#17320b',
  neutralDark: '#2d3436',
  neutralMedium: '#636e72',
  neutralLight: '#b2bec3',
  neutralBg: '#f5f6fa',
  white: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db'
};

// צבעים לכרטיסי סיכום
export const CARD_COLORS = {
  revenue: 'bg-green-50 border-2 border-green-200',
  cogs: 'bg-orange-50 border-2 border-orange-200',
  grossProfit: 'bg-emerald-50 border-2 border-emerald-200',
  opProfit: 'bg-teal-50 border-2 border-teal-200',
  netProfit: 'bg-cyan-50 border-2 border-cyan-200',
  operatingProfit: 'bg-emerald-50 border-2 border-emerald-200'
};

// שמות חודשים בעברית
export const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

// הגדרות CSV
export const REPORT_CONFIG = {
  CSV_FILE_PATH: '/TransactionMonthlyModi.csv',
  MAX_TABLE_HEIGHT: '70vh',
  SCROLLBAR_COLOR: LITAY_COLORS.primary,
  SCROLLBAR_TRACK_COLOR: LITAY_COLORS.neutralBg
};

// מפתחות לשמירה ב-localStorage
export const STORAGE_KEYS = {
  OPENING_INVENTORY: 'biurim_opening_inventory',
  CLOSING_INVENTORY: 'biurim_closing_inventory',
  ADJUSTMENTS_2024: 'biurim_adjustments_2024'
};
