כמובן! הנה קובץ DESIGN_GUIDE.md:
markdown# 📐 LITAY Finance - מדריך עיצוב

## 🎨 עקרונות עיצוב ראשיים

### 1. **מינימליזם מקצועי**
- עיצוב נקי ומסודר ללא אלמנטים מיותרים
- שימוש בחללים לבנים (whitespace) ליצירת היררכיה ברורה
- פוקוס על תוכן ופונקציונליות

### 2. **פלטת צבעים LITAY**
```css
/* צבעי מותג רשמיים */
--litay-primary: #528163;    /* ירוק ראשי */
--litay-dark: #17320b;       /* ירוק כהה */
--litay-accent: #8dd1bb;     /* ירוק בהיר */
--litay-light: #c0c2c3;      /* אפור בהיר */
--litay-lighter: #e4e5e9;    /* אפור בהיר מאוד */
3. כיוון RTL מלא

כל הממשק בעברית עם תמיכה מלאה ב-RTL
יישור טקסט לימין
איקונים וכיווני תנועה מותאמים


🎨 הנחיות עיצוב לקומפוננטות
כרטיסים ומיכלים
css/* כרטיס בסיסי */
.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid var(--litay-lighter);
}

/* כרטיס עם דגש */
.card-accent {
  border-left: 4px solid var(--litay-primary);
}
כפתורים
css/* כפתור ראשי */
.btn-primary {
  background-color: var(--litay-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: var(--litay-dark);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* כפתור משני */
.btn-secondary {
  background-color: var(--litay-lighter);
  color: var(--litay-dark);
  border: 2px solid var(--litay-light);
}
טבלאות
css/* טבלה מינימליסטית */
.table {
  background: white;
  border: 1px solid var(--litay-lighter);
  border-collapse: collapse;
}

.table th {
  background-color: var(--litay-lighter);
  color: var(--litay-dark);
  font-weight: 600;
  padding: 0.75rem;
  text-align: right;
}

.table td {
  padding: 0.75rem;
  border-top: 1px solid var(--litay-lighter);
}

.table tr:hover {
  background-color: #f9fafb;
}

🎨 עיצוב סעיפים בדוחות
הכנסות
css.section-income {
  background-color: #f0f4f2;      /* רקע ירוק-אפור בהיר */
  border-color: var(--litay-primary);
  color: var(--litay-dark);
}
הוצאות
css.section-expense {
  background-color: var(--litay-lighter);  /* רקע אפור בהיר */
  border-color: var(--litay-light);
  color: #374151;
}
סיכומים
css.summary-positive {
  background-color: #ecfdf5;      /* רקע ירוק בהיר מאוד */
  border-color: var(--litay-primary);
  color: var(--litay-dark);
}

.summary-negative {
  background-color: #fef3f3;      /* רקע אדום בהיר מאוד */
  border-color: #9ca3af;
  color: #374151;
}

📏 Spacing System
css/* מערכת ריווחים עקבית */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */

🔤 טיפוגרפיה
גופנים
css/* גופן ראשי בעברית */
--font-hebrew: 'Assistant', 'Heebo', -apple-system, sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
גדלי טקסט
css--text-xs: 0.75rem;    /* 12px - הערות קטנות */
--text-sm: 0.875rem;   /* 14px - טקסט משני */
--text-base: 1rem;     /* 16px - טקסט רגיל */
--text-lg: 1.125rem;   /* 18px - כותרות משנה */
--text-xl: 1.25rem;    /* 20px - כותרות */
--text-2xl: 1.5rem;    /* 24px - כותרות ראשיות */
--text-3xl: 2rem;      /* 32px - כותרת ראשית */
משקלי גופן
css--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

🎭 מצבי אינטראקציה
Hover States
css/* רק על אלמנטים אינטראקטיביים */
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}
Focus States
css/* נגישות - focus ברור */
.interactive:focus {
  outline: 2px solid var(--litay-primary);
  outline-offset: 2px;
}
Active States
css.interactive:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

📱 Responsive Design
Breakpoints
css--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
Grid System
css.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

✨ אנימציות
כללי
css/* אנימציות עדינות ומהירות */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
דוגמאות
css/* פתיחת אקורדיון */
.accordion-content {
  transition: all var(--transition-slow);
}

/* הופעת כרטיס */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

🚫 מה להימנע ממנו
❌ אל תשתמש ב:

צבעים צעקניים (אדום חזק, כתום, סגול)
גרדיאנטים מורכבים
צללים כבדים
אנימציות מוגזמות
גופנים דקורטיביים
רקעים עם תמונות

✅ השתמש במקום ב:

גוונים עדינים של ירוק ואפור
צבעים אחידים (solid colors)
צללים עדינים
אנימציות פשוטות
גופנים נקיים ומקצועיים
רקעים נקיים


🎯 דוגמאות קוד
כרטיס סיכום
jsx<div className="bg-white rounded-lg shadow-sm p-6 border-l-4" 
     style={{ borderLeftColor: LITAY_COLORS.primary }}>
  <h3 className="text-lg font-semibold mb-2" 
      style={{ color: LITAY_COLORS.dark }}>
    הכנסות
  </h3>
  <p className="text-2xl font-bold" 
     style={{ color: LITAY_COLORS.primary }}>
    ₪2,853,108.37
  </p>
</div>
כפתור מותאם
jsx<button 
  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
  style={{
    backgroundColor: showAll ? LITAY_COLORS.accent : LITAY_COLORS.lighter,
    color: LITAY_COLORS.dark,
    border: `2px solid ${showAll ? LITAY_COLORS.primary : LITAY_COLORS.light}`
  }}
>
  {showAll ? '🔽 סגור הכל' : '▶️ פתח הכל'}
</button>
טבלת נתונים
jsx<table className="min-w-full bg-white rounded-lg overflow-hidden">
  <thead>
    <tr style={{ backgroundColor: LITAY_COLORS.lighter }}>
      <th className="px-4 py-3 text-right font-semibold"
          style={{ color: LITAY_COLORS.dark }}>
        שם חשבון
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 border-t" 
          style={{ borderColor: LITAY_COLORS.lighter }}>
        הכנסות ממכירות
      </td>
    </tr>
  </tbody>
</table>

📋 Checklist לעיצוב
לפני יישום עיצוב חדש, וודא:

 צבעים מפלטת LITAY בלבד
 טקסט ברור וקריא (contrast ratio > 4.5:1)
 ריווחים עקביים מה-spacing system
 תמיכה מלאה ב-RTL
 מצבי hover/focus/active מוגדרים
 responsive לכל הרזולוציות
 אנימציות חלקות ועדינות
 נגישות (WCAG 2.1 AA)


🔧 כלים מומלצים
VS Code Extensions

Tailwind CSS IntelliSense - השלמות אוטומטיות
Color Highlight - הצגת צבעים
CSS Peek - ניווט מהיר

Chrome DevTools

Lighthouse - בדיקת ביצועים ונגישות
CSS Overview - סקירת עיצוב
Device Mode - בדיקת רספונסיביות


📊 דוגמאות מהפרויקט
מבנה סעיף בדוח
typescript{
  title: "הכנסות",
  codes: ["600", "700"],
  isPositive: true,
  color: LITAY_COLORS.lighter,           // רקע בהיר מאוד
  textColor: LITAY_COLORS.dark,          // טקסט כהה
  bgColor: '#f0f9f4',                    // רקע ירוק בהיר מאוד
  borderColor: LITAY_COLORS.primary,     // גבול ירוק ראשי
  hoverColor: '#e8f5ed',                 // צבע hover
  icon: '💰'
}
פורמט מספרים
typescriptexport const numberFormat = (n: number): string => {
  return n.toLocaleString('he-IL', { 
    style: 'currency', 
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
// תוצאה: ₪2,853,108.37

עדכון אחרון: 27/05/2025 | גרסה: 1.0.0
