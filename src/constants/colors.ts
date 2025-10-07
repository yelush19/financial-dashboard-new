// src/constants/colors.ts
// 🎨 צבעים שחולצו מהקוד הקיים של HierarchicalReport.tsx

/**
 * 🎴 צבעי כרטיסי סיכום
 * בדיוק כמו שהם בשימוש בקוד הנוכחי
 */
export const CARD_COLORS = {
  // כרטיס הכנסות
  revenue: {
    container: 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300',
    iconBg: 'bg-green-500',
    iconText: 'text-white',
    valueText: 'text-green-700',
    badge: 'bg-green-100',
    badgeText: 'text-green-600',
  },
  
  // כרטיס הוצאות
  expense: {
    container: 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-300',
    iconBg: 'bg-gray-500',
    iconText: 'text-white',
    valueText: 'text-gray-700',
    badge: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
  
  // כרטיס רווח נקי
  netProfit: {
    container: 'bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-400',
    iconBg: 'bg-teal-500',
    iconText: 'text-white',
    valueText: 'text-teal-700',
    badge: 'bg-teal-100',
    badgeText: 'text-teal-600',
  },
  
  // כרטיס אחוז רווחיות
  profitability: {
    container: 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-400',
    iconBg: 'bg-orange-500',
    iconText: 'text-white',
    valueText: 'text-orange-700',
    badgeText: 'text-orange-600',
  },
};

/**
 * 🎯 צבעי אייקוני קטגוריות
 */
export const CATEGORY_ICON_COLORS = {
  revenue: 'text-green-600',      // TrendingUp - הכנסות
  cogs: 'text-orange-600',        // Package2 - עלות המכר
  operating: 'text-slate-600',    // Building2 - הוצאות תפעול
  financial: 'text-gray-600',     // Landmark - הוצאות מימון
};

/**
 * 📊 צבעים לגרפים (HEX)
 * בדיוק כמו שמשמשים ב-Recharts
 */
export const CHART_COLORS = {
  revenue: '#10b981',        // ירוק - הכנסות
  operating: '#6b7280',      // אפור - הוצאות תפעול
  grossProfit: '#10b981',    // ירוק - רווח גולמי
  operatingProfit: '#0ea5e9', // כחול - רווח תפעולי
  netProfit: '#14b8a6',      // טורקיז - רווח נקי
  marketing: '#f97316',      // כתום - שיווק
};

/**
 * 💰 רקעים לשורות רווח
 */
export const PROFIT_ROWS = {
  // רווח גולמי
  gross: {
    container: 'bg-green-50 border border-green-300',
    valueText: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  
  // רווח תפעולי
  operating: {
    container: 'bg-emerald-50 border border-emerald-300',
    valueText: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  
  // רווח נקי (סופי)
  net: {
    container: 'bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-400',
    valueText: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
  },
};

/**
 * 🎨 צבעי רקע כלליים
 */
export const BG_COLORS = {
  white: 'bg-white',
  grayLight: 'bg-gray-50',
  gray100: 'bg-gray-100',
  gray200: 'bg-gray-200',
};

/**
 * 📝 צבעי טקסט כלליים
 */
export const TEXT_COLORS = {
  primary: 'text-gray-800',
  secondary: 'text-gray-700',
  muted: 'text-gray-600',
  light: 'text-gray-500',
  
  // צבעים לקטגוריות
  green: 'text-green-600',
  emerald: 'text-emerald-700',
  teal: 'text-teal-700',
  gray: 'text-gray-700',
};

/**
 * 🔲 צבעי גבולות
 */
export const BORDER_COLORS = {
  default: 'border-gray-200',
  light: 'border-gray-100',
  gray300: 'border-gray-300',
};

/**
 * 🎭 צבעי Hover
 */
export const HOVER_COLORS = {
  grayLight: 'hover:bg-gray-50',
  gray100: 'hover:bg-gray-100',
  white: 'hover:bg-white',
  blue: 'hover:bg-blue-50',
};

export default {
  CARD_COLORS,
  CATEGORY_ICON_COLORS,
  CHART_COLORS,
  PROFIT_ROWS,
  BG_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  HOVER_COLORS,
};