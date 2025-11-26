#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ניתוח תנועות מבטלות - קובץ TransactionMonthlyModi.csv
מטרה: זיהוי תנועות שצריך לסנן מהדוחות
"""

import pandas as pd
import sys
from collections import defaultdict

# קריאת הקובץ
print("📁 קורא את קובץ התנועות...")
try:
    df = pd.read_csv('/mnt/project/TransactionMonthlyModi.csv', encoding='utf-8-sig')
    print(f"✅ נטענו {len(df):,} תנועות")
except Exception as e:
    print(f"❌ שגיאה בקריאת הקובץ: {e}")
    sys.exit(1)

# ניקוי נתונים
df['חובה / זכות (שקל)'] = pd.to_numeric(df['חובה / זכות (שקל)'].astype(str).str.replace(',', ''), errors='coerce')
df['ח-ן נגדי'] = pd.to_numeric(df['ח-ן נגדי'], errors='coerce')
df['מפתח חשבון'] = pd.to_numeric(df['מפתח חשבון'], errors='coerce')

print("\n" + "="*80)
print("🔍 ניתוח 1: תנועות מול חשבון 37999 (חשבון מעבר)")
print("="*80)

# סינון תנועות 37999
df_37999 = df[df['ח-ן נגדי'] == 37999].copy()
print(f"\n📊 נמצאו {len(df_37999):,} תנועות מול חשבון 37999")

if len(df_37999) > 0:
    # קיבוץ לפי פרטים
    grouped = df_37999.groupby('פרטים')
    
    # זיהוי זוגות מבטלים
    cancelling_pairs = []
    
    for details, group in grouped:
        if len(group) >= 2:
            amounts = group['חובה / זכות (שקל)'].values
            
            # בדיקה אם יש זוג מבטל (חיובי + שלילי)
            for i in range(len(amounts)):
                for j in range(i+1, len(amounts)):
                    if abs(amounts[i] + amounts[j]) < 0.01:  # מתחשב בעיגול
                        cancelling_pairs.append({
                            'פרטים': details,
                            'סכום_1': amounts[i],
                            'סכום_2': amounts[j],
                            'תאריך_1': group.iloc[i]['ת.אסמכ'],
                            'תאריך_2': group.iloc[j]['ת.אסמכ'],
                            'חשבון': group.iloc[i]['שם חשבון'],
                            'כותרת_1': group.iloc[i]['כותרת'],
                            'כותרת_2': group.iloc[j]['כותרת']
                        })
    
    print(f"\n✅ נמצאו {len(cancelling_pairs)} זוגות תנועות מבטלות (37999)")
    
    # הצגת דוגמאות
    print("\n📋 דוגמאות (10 ראשונות):")
    print("-" * 120)
    for i, pair in enumerate(cancelling_pairs[:10], 1):
        print(f"\n{i}. פרטים: {pair['פרטים'][:60]}")
        print(f"   תנועה 1: {pair['תאריך_1']} | {pair['סכום_1']:>10,.2f} ₪ | כותרת: {pair['כותרת_1']}")
        print(f"   תנועה 2: {pair['תאריך_2']} | {pair['סכום_2']:>10,.2f} ₪ | כותרת: {pair['כותרת_2']}")
        print(f"   חשבון: {pair['חשבון']}")
        print(f"   סטטוס: {'✅ מבטלות זו את זו' if abs(pair['סכום_1'] + pair['סכום_2']) < 0.01 else '⚠️ לא מדויק'}")

print("\n" + "="*80)
print("🔍 ניתוח 2: סטורנויים (תנועות עם מילות מפתח)")
print("="*80)

# מילות מפתח לזיהוי סטורנויים
keywords = ['ביטול', 'סטורנ', 'storno', 'מבוטל', 'ביטל', 'בטל']

# חיפוש בשדה פרטים
mask = df['פרטים'].str.contains('|'.join(keywords), case=False, na=False)
df_storno = df[mask].copy()

print(f"\n📊 נמצאו {len(df_storno):,} תנועות עם מילות מפתח של ביטול")

# ניתוח לפי מילת מפתח
print("\n📋 פירוט לפי מילת מפתח:")
for keyword in keywords:
    count = df['פרטים'].str.contains(keyword, case=False, na=False).sum()
    if count > 0:
        print(f"   • '{keyword}': {count:,} תנועות")

# זיהוי זוגות מבטלים בסטורנויים
print("\n🔍 זיהוי זוגות מבטלים בסטורנויים...")

storno_pairs = []
for keyword in keywords:
    df_keyword = df[df['פרטים'].str.contains(keyword, case=False, na=False)]
    
    for details, group in df_keyword.groupby('פרטים'):
        if len(group) >= 2:
            amounts = group['חובה / זכות (שקל)'].values
            
            for i in range(len(amounts)):
                for j in range(i+1, len(amounts)):
                    if abs(amounts[i] + amounts[j]) < 0.01:
                        storno_pairs.append({
                            'מילת_מפתח': keyword,
                            'פרטים': details,
                            'סכום_1': amounts[i],
                            'סכום_2': amounts[j],
                            'תאריך_1': group.iloc[i]['ת.אסמכ'],
                            'תאריך_2': group.iloc[j]['ת.אסמכ'],
                            'חשבון': group.iloc[i]['שם חשבון'],
                            'כותרת_1': group.iloc[i]['כותרת'],
                            'כותרת_2': group.iloc[j]['כותרת']
                        })

print(f"\n✅ נמצאו {len(storno_pairs)} זוגות סטורנויים מבטלים")

# הצגת דוגמאות
print("\n📋 דוגמאות סטורנויים (10 ראשונות):")
print("-" * 120)
for i, pair in enumerate(storno_pairs[:10], 1):
    print(f"\n{i}. מילת מפתח: '{pair['מילת_מפתח']}'")
    print(f"   פרטים: {pair['פרטים'][:60]}")
    print(f"   תנועה 1: {pair['תאריך_1']} | {pair['סכום_1']:>10,.2f} ₪ | כותרת: {pair['כותרת_1']}")
    print(f"   תנועה 2: {pair['תאריך_2']} | {pair['סכום_2']:>10,.2f} ₪ | כותרת: {pair['כותרת_2']}")
    print(f"   חשבון: {pair['חשבון']}")

print("\n" + "="*80)
print("📊 סיכום כללי")
print("="*80)

total_cancelling = len(cancelling_pairs) + len(storno_pairs)
print(f"\n✅ סה\"ך זוגות תנועות מבטלות שזוהו: {total_cancelling}")
print(f"   • תנועות 37999: {len(cancelling_pairs)}")
print(f"   • סטורנויים: {len(storno_pairs)}")

# חישוב השפעה על דוחות
total_cancelled_amount = 0
for pair in cancelling_pairs:
    total_cancelled_amount += abs(pair['סכום_1'])

for pair in storno_pairs:
    total_cancelled_amount += abs(pair['סכום_1'])

print(f"\n💰 סה\"ך סכומים מבוטלים: {total_cancelled_amount:,.2f} ₪")
print(f"   (כל זוג נספר פעם אחת)")

print("\n" + "="*80)
print("🎯 המלצות ליישום סינון")
print("="*80)

print("""
1️⃣ סינון תנועות 37999:
   • זהה כל תנועה עם ח-ן נגדי = 37999
   • קבץ לפי שדה "פרטים"
   • חפש זוגות עם סכומים מנוגדים
   • סמן את שתי התנועות כ-"מבוטלת"

2️⃣ סינון סטורנויים:
   • חפש תנועות עם מילות: "ביטול", "סטורנ", "storno", "מבוטל"
   • קבץ לפי שדה "פרטים"
   • חפש זוגות עם סכומים מנוגדים
   • סמן את שתי התנועות כ-"מבוטלת"

3️⃣ יישום בדוחות:
   • הוסף שדה "מבוטלת" (boolean) לכל תנועה
   • סנן תנועות מבוטלות מחישובי הדוחות
   • שמור לוג של תנועות שסוננו
   • אפשר toggle להצגת/הסתרת תנועות מבוטלות

4️⃣ אופטימיזציה:
   • שמור mapping של כותרות מבוטלות
   • עדכן אוטומטית כשמוסיפים תנועות חדשות
   • בדוק consistency בין חודשים
""")

print("\n✅ ניתוח הושלם!")
