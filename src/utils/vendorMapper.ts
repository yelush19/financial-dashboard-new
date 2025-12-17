/**
 * vendorMapper.ts
 * מיפוי ספקים לתנועות בחשבון 37999 על בסיס עמודת "פרטים"
 *
 * הלוגיקה:
 * 1. תנועות עם חשבון נגדי 37999 לא ממופות לספק
 * 2. מחפשים מילות מפתח בעמודת "פרטים"
 * 3. מחזירים את מפתח הספק המתאים
 *
 * מבוסס על קובץ OldTransactionMappingModi2025.csv - עמודת "ספק תקין"
 */

export interface VendorMapping {
  keywords: string[];           // מילות מפתח לזיהוי
  vendorKey: number;           // מפתח חשבון הספק
  vendorName: string;          // שם הספק
}

// טבלת מיפוי ספקים - מבוססת על OldTransactionMappingModi2025.csv
export const VENDOR_MAPPINGS: VendorMapping[] = [
  // תקשורת
  { keywords: ['בזק', 'BEZEQ'], vendorKey: 20000, vendorName: 'בזק' },
  { keywords: ['פנגו', 'PANGO'], vendorKey: 20010, vendorName: 'פנגו' },
  { keywords: ['כביש 6'], vendorKey: 20011, vendorName: 'כביש 6' },

  // שילוח ולוגיסטיקה
  { keywords: ['תפוז'], vendorKey: 20013, vendorName: 'תפוז שליחויות בע"מ' },
  { keywords: ['פלאנט', 'PLANET', 'MODI'], vendorKey: 20035, vendorName: 'פלאנט שילוח ולוגיסטיקה בע"מ' },

  // שיווק ופרסום
  { keywords: ['GOOGLE', 'גוגל'], vendorKey: 20042, vendorName: 'Google' },
  { keywords: ['שנטי גדרון'], vendorKey: 20044, vendorName: 'שנטי גדרון' },
  { keywords: ['ZENDESK'], vendorKey: 20082, vendorName: 'zendesk שירות לקוחות 80010' },
  { keywords: ['META', 'FACEBK', 'פייסבוק', 'FACEBOOK'], vendorKey: 30068, vendorName: 'META/ פייסבוק' },
  { keywords: ['KLAVIYO'], vendorKey: 20142, vendorName: 'Klaviyo Inc אימייל מרק 50012' },

  // סליקה ותשלומים
  { keywords: ['פייפלוס', 'פאיפלוס', 'פאי פלוס', 'PAY PLUS'], vendorKey: 20097, vendorName: 'פיי פלוס בע"מ' },
  { keywords: ['שופיפיי', 'SHOPIFY'], vendorKey: 20104, vendorName: 'Shopify International Limited' },
  { keywords: ['ביימי', 'ביי מי', 'BUYME'], vendorKey: 20105, vendorName: 'ביימי טכנולוגיות בע"מ' },

  // ייעוץ ושירותים מקצועיים
  { keywords: ['עומר להט'], vendorKey: 20122, vendorName: 'עומר להט' },
  { keywords: ['שביט וזהו'], vendorKey: 20128, vendorName: 'שביט וזהו בע"מ' },
  { keywords: ['רעות תקני'], vendorKey: 20145, vendorName: 'רעות תקני לי' },

  // רכב וליסינג
  { keywords: ['ליסקאר', 'LISCAR', 'מנהרות', 'מוקד'], vendorKey: 30677, vendorName: 'ליסקאר' },
  { keywords: ['תדלק', 'סולר', 'דלק'], vendorKey: 30697, vendorName: 'תדלק וסע בע"מ' },

  // רשתות קמעונאיות
  { keywords: ['וויסל'], vendorKey: 30345, vendorName: 'וויסל סחר בע"מ' },
  { keywords: ['סטודנט גרופ'], vendorKey: 30452, vendorName: 'סטודנט גרופ ס.ג בע"מ' },
  { keywords: ['סופרפארם', 'SUPERPHARM'], vendorKey: 30696, vendorName: 'סופר פארם בע"מ' },

  // תוכנה ומערכות
  { keywords: ['גולדנטק', 'GOODS'], vendorKey: 30710, vendorName: 'גולדנטק מערכות מידע בע"מ - goods' },
  { keywords: ['ADOBE', 'אדובי'], vendorKey: 37095, vendorName: 'ADOBE- ספקי אינטרנט 80038' },
  { keywords: ['FIGMA', 'פיגמה'], vendorKey: 37140, vendorName: '80021 -FIGMA' },

  // הנהלת חשבונות וייעוץ עסקי
  { keywords: ['ליתאי'], vendorKey: 30782, vendorName: 'ליתאי ניהול שירותים בע"מ' },
  { keywords: ['להב'], vendorKey: 30787, vendorName: 'להב פיתוח מנהלים בע"מ' },
  { keywords: ['פזמ'], vendorKey: 30789, vendorName: 'פזמ שיווק ופרסום בע"מ' },
  { keywords: ['קרני', 'אוריקס'], vendorKey: 30761, vendorName: 'קרני ראם- אוריקס פאונדס בע"מ' },

  // ספקים נוספים
  { keywords: ['לובה שרגא'], vendorKey: 37013, vendorName: 'לובה שרגא בע"מ' },
  { keywords: ['יעקבס גבינות'], vendorKey: 37014, vendorName: 'יעקבס גבינות ולחמים בע"מ' },
  { keywords: ['יובל רשף'], vendorKey: 37015, vendorName: 'יובל רשף' },
  { keywords: ['אלי אדרי'], vendorKey: 37044, vendorName: 'אלי אדרי' },
  { keywords: ['פולסים'], vendorKey: 37068, vendorName: 'פולסים בע"מ -50012-הוצ\' אימייל מרקטינג' },
  { keywords: ['מיכל אוליברו', 'ח.ח.ח'], vendorKey: 37093, vendorName: 'ח.ח.ח טכנולוגיות בעמ (מיכל אוליברו)' },
  { keywords: ['ד.מ פוסט', 'דמ פוסט'], vendorKey: 37099, vendorName: 'ד.מ פוסט בע"מ' },
  { keywords: ['מאיה מושל'], vendorKey: 37119, vendorName: 'מאיה מושל רומנו' },
  { keywords: ['טריגלו', 'TRIGALO', 'B.M.A'], vendorKey: 37148, vendorName: 'טריגלו-B.M.A TRIGALO-הובלות' },
  { keywords: ['לורן מיריאל', 'לורן שטרן'], vendorKey: 37149, vendorName: 'לורן מיריאל שטרן' },
];

/**
 * מחפש ספק מתאים על בסיס טקסט מעמודת "פרטים"
 * @param details - הטקסט מעמודת פרטים
 * @returns מיפוי ספק או null אם לא נמצא
 */
export function findVendorFromDetails(details: string): VendorMapping | null {
  if (!details) return null;

  const normalizedDetails = details.toLowerCase().trim();

  for (const mapping of VENDOR_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalizedDetails.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }

  return null;
}

/**
 * מקבל תנועה ומחזיר את מפתח הספק הנכון
 * אם החשבון הנגדי הוא 37999, מנסה למפות לפי עמודת פרטים
 * @param counterAccountNumber - מספר חשבון נגדי
 * @param counterAccountName - שם חשבון נגדי
 * @param details - עמודת פרטים
 * @returns { vendorKey, vendorName } - מפתח ושם הספק
 */
export function resolveVendor(
  counterAccountNumber: number,
  counterAccountName: string,
  details: string
): { vendorKey: number; vendorName: string } {
  // אם החשבון הנגדי הוא 37999, מנסים למצוא את הספק מעמודת פרטים
  if (counterAccountNumber === 37999) {
    const mapping = findVendorFromDetails(details);
    if (mapping) {
      return {
        vendorKey: mapping.vendorKey,
        vendorName: mapping.vendorName
      };
    }
    // אם לא נמצא מיפוי, נשאיר את 37999 עם תיאור מהפרטים
    const shortDetails = details.length > 30 ? details.substring(0, 30) + '...' : details;
    return {
      vendorKey: 37999,
      vendorName: `37999 - ${shortDetails || 'ספקים לשלם'}`
    };
  }

  // אחרת, משתמשים בחשבון הנגדי הרגיל
  return {
    vendorKey: counterAccountNumber,
    vendorName: counterAccountName
  };
}

/**
 * בודק אם תנועה היא מחשבון 37999
 */
export function isAccount37999(counterAccountNumber: number): boolean {
  return counterAccountNumber === 37999;
}
