import { useState } from "react";
import { FileText, BarChart3, Database, TrendingUp, Phone, Mail, MapPin, ExternalLink, Shield, Zap, Award } from "lucide-react";
import HierarchicalReport from "./components/reports/HierarchicalReport";
import MonthlyReport from "./components/reports/MonthlyReport";
import BiurimSystem from "./components/reports/biurim/BiurimSystem";
import { ProtectedRoute } from './components/ProtectedRoute';
import SingleMonthPLReport from './components/reports/SingleMonthPL';

// פלטת צבעים רשמית של ליתאי
const LITAY = {
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

const tabs = [
  { id: 'hierarchical', label: "דוח רווח והפסד", icon: FileText },
  { id: 'pivot', label: "דוח רווח והפסד חודשי", icon: BarChart3 },
  { id: 'quarterly', label: "P&L תצוגת חודש", icon: TrendingUp },
  { id: 'biurim', label: "מערכת ביאורים", icon: FileText }
];

function App() {
  const [selectedTab, setSelectedTab] = useState("hierarchical");

  return (
     <ProtectedRoute>
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl" style={{ fontFamily: 'Assistant, Heebo, Arial Hebrew, sans-serif', overflowX: 'hidden' }}>
      {/* Header - משופר עם אפקטים */}
      <header 
        className="sticky top-0 z-50 w-full"
        style={{ 
          background: `linear-gradient(135deg, ${LITAY.primary} 0%, ${LITAY.primaryDark} 100%)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo & Title - עם לוגו אמיתי */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white p-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <img src="/LITAYLOGO.png" alt="Litay Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-md">ליתאי ניהול שירותים בע"מ</h1>
                <p className="text-sm text-white/90 italic font-medium">Innovation in Balance</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - משופר */}
          <div className="flex gap-2 pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className="flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-semibold relative overflow-hidden group"
                  style={{
                    backgroundColor: isActive ? LITAY.white : 'transparent',
                    color: isActive ? LITAY.primaryDark : LITAY.white,
                    boxShadow: isActive ? '0 -4px 10px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-6">
        {/* Content Area - Full Width */}
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200" style={{ borderRight: `4px solid ${LITAY.primary}` }}>
            <div className="p-6">
              {selectedTab === 'hierarchical' && <HierarchicalReport />}
              {selectedTab === 'pivot' && <MonthlyReport />}
              {selectedTab === 'quarterly' && <SingleMonthPLReport />}
              {selectedTab === 'raw' && <RawDataContent />}
              {selectedTab === 'biurim' && <BiurimSystem />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - עיצוב חדש WOW */}
      <footer className="mt-16 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0" style={{ 
          background: `linear-gradient(135deg, ${LITAY.primaryDark} 0%, ${LITAY.primary} 50%, ${LITAY.primaryLight} 100%)`,
          opacity: 0.95
        }} />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative max-w-[1920px] mx-auto px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-12 gap-8 py-12">
            {/* Column 1 - Company Info (4 cols) */}
            <div className="col-span-4 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                  <img src="/LITAYLOGO.png" alt="Litay Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">ליתאי</h3>
                  <p className="text-lg text-white/90 font-medium">ניהול שירותים בע"מ</p>
                  <p className="text-sm text-white/80 italic mt-1">Innovation in Balance</p>
                </div>
              </div>

              <p className="text-white/90 text-sm leading-relaxed">
                משרד הנהלת חשבונות מתקדם המתמחה במערכות חכמות ודיגיטליות. אנו משלבים מומחיות מסורתית עם טכנולוגיה מתקדמת.
              </p>

              <div className="flex gap-3">
                {[Shield, Zap, Award].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer hover:scale-110 border border-white/30">
                    <Icon size={20} className="text-white" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 - Quick Links (3 cols) */}
            <div className="col-span-3">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-white rounded-full" />
                קישורים מהירים
              </h4>
              <ul className="space-y-3">
                {[
                  "דוחות מתקדמים",
                  "ניתוח נתונים",
                  "התעלות מערכות",
                  "ייעוץ פיננסי",
                  "אסטרטגיה עסקית"
                ].map((link, i) => (
                  <li key={i}>
                    <button className="text-white/90 hover:text-white text-sm transition-all flex items-center gap-2 group">
                      <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                      <span className="group-hover:underline">{link}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Contact (3 cols) */}
            <div className="col-span-3">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-white rounded-full" />
                יצירת קשר
              </h4>
              <div className="space-y-4">
                {[
                  { icon: MapPin, text: "ישראל" },
                  { icon: Phone, text: "שירותי מזכירות" },
                  { icon: Mail, text: "info@litay.co.il" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/90 hover:text-white transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 transition-all border border-white/30">
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4 - Newsletter (2 cols) */}
            <div className="col-span-2">
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-white rounded-full" />
                עדכונים
              </h4>
              <div className="space-y-3">
                <input 
                  type="email" 
                  placeholder="המייל שלך"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-all"
                />
                <button className="w-full py-2.5 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-lg">
                  הרשמה
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 py-6">
            <div className="flex items-center justify-between text-white/90">
              <div className="flex items-center gap-2 text-sm">
                <span>© 2025</span>
                <span className="font-bold">ליתאי ניהול שירותים בע"מ</span>
                <span>·</span>
                <span>כל הזכויות שמורות</span>
              </div>
              <div className="text-xs">
                פיתוח ועיצוב: <span className="font-semibold">Litay Tech</span> · גרסה 1.0.0
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ProtectedRoute>
  );
}

// Quarterly Content
function QuarterlyContent() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {['רבעון 1', 'רבעון 2', 'רבעון 3'].map((q, i) => (
        <div 
          key={i} 
          className="rounded-xl p-8 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200"
          style={{ backgroundColor: LITAY.neutralBg, borderTop: `4px solid ${LITAY.primary}` }}
        >
          <h3 className="text-2xl font-bold mb-6" style={{ color: LITAY.primaryDark }}>{q}</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: LITAY.neutralMedium }}>הכנסות</div>
              <div className="text-3xl font-bold" style={{ color: LITAY.primary, fontFamily: 'Rubik, Arial' }}>
                ₪{(Math.random() * 1000000).toFixed(0)}
              </div>
            </div>
            <div className="h-px bg-gray-300 my-4" />
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: LITAY.neutralMedium }}>רווח</div>
              <div className="text-3xl font-bold" style={{ color: LITAY.success, fontFamily: 'Rubik, Arial' }}>
                ₪{(Math.random() * 300000).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Raw Data Content
function RawDataContent() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: LITAY.neutralBg }}>
            <th className="px-4 py-3 text-right font-bold" style={{ color: LITAY.primaryDark }}>תאריך</th>
            <th className="px-4 py-3 text-right font-bold" style={{ color: LITAY.primaryDark }}>חשבון</th>
            <th className="px-4 py-3 text-right font-bold" style={{ color: LITAY.primaryDark }}>פרטים</th>
            <th className="px-4 py-3 text-center font-bold" style={{ color: LITAY.primaryDark }}>סכום</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }).map((_, i) => (
            <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: LITAY.neutralLight }}>
              <td className="px-4 py-3 font-medium" style={{ color: LITAY.neutralDark }}>15/05/2025</td>
              <td className="px-4 py-3" style={{ color: LITAY.neutralDark }}>חשבון {1000 + i}</td>
              <td className="px-4 py-3" style={{ color: LITAY.neutralMedium }}>תנועה מספר {i + 1}</td>
              <td className="px-4 py-3 text-center font-bold" style={{ color: LITAY.primary, fontFamily: 'Rubik, Arial' }}>
                ₪{(Math.random() * 50000).toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;