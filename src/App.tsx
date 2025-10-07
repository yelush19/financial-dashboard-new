import { useState } from "react";
import { FileText, BarChart3, Database, TrendingUp, Search, Filter, Download, RefreshCw, Phone, Mail, MapPin, ExternalLink, Shield, Zap, Award } from "lucide-react";

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
  { id: 'pivot', label: "דוח PIVOT חודשי", icon: BarChart3 },
  { id: 'quarterly', label: "דוח רבעוני מתקדם", icon: TrendingUp },
  { id: 'raw', label: "תנועות גולמיות", icon: Database }
];

function App() {
  const [selectedTab, setSelectedTab] = useState("hierarchical");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  return (
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

            {/* Period & Actions */}
            <div className="flex items-center gap-6">
              <div className="bg-white/15 backdrop-blur-md rounded-xl px-5 py-2.5 border border-white/30 shadow-lg hover:bg-white/20 transition-all">
                <span className="text-white text-sm font-semibold">תקופת דיווח: 01.2025-05.2025</span>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all border border-white/30 backdrop-blur-md shadow-lg hover:scale-105 active:scale-95">
                  <RefreshCw size={18} className="text-white" />
                </button>
                <button className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-all border border-white/30 backdrop-blur-md shadow-lg hover:scale-105 active:scale-95">
                  <Download size={18} className="text-white" />
                </button>
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
        {/* Control Bar - משופר */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-200" style={{ borderRight: `4px solid ${LITAY.primary}` }}>
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative group">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: LITAY.neutralMedium }} />
              <input
                type="text"
                placeholder="חיפוש בנתונים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: LITAY.neutralLight,
                  backgroundColor: LITAY.neutralBg
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = LITAY.primary;
                  e.target.style.backgroundColor = LITAY.white;
                  e.target.style.boxShadow = `0 0 0 4px ${LITAY.primaryLight}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = LITAY.neutralLight;
                  e.target.style.backgroundColor = LITAY.neutralBg;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: showFilters ? LITAY.primary : LITAY.white,
                color: showFilters ? LITAY.white : LITAY.primaryDark,
                borderColor: LITAY.primary
              }}
            >
              <Filter size={18} />
              <span>פילטרים</span>
            </button>

            {/* Quick Stats */}
            <div className="flex gap-6 pr-6 border-r-2" style={{ borderColor: LITAY.neutralLight }}>
              <div className="text-center">
                <div className="text-xs font-medium mb-1" style={{ color: LITAY.neutralMedium }}>רשומות</div>
                <div className="text-xl font-bold" style={{ color: LITAY.primaryDark, fontFamily: 'Rubik, Arial' }}>7,156</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium mb-1" style={{ color: LITAY.neutralMedium }}>חודשים</div>
                <div className="text-xl font-bold" style={{ color: LITAY.primaryDark, fontFamily: 'Rubik, Arial' }}>5</div>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t grid grid-cols-4 gap-4" style={{ borderColor: LITAY.neutralLight }}>
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: LITAY.neutralDark }}>חודש</label>
                <select className="w-full px-3 py-2.5 rounded-lg border-2 focus:outline-none transition-all" 
                        style={{ borderColor: LITAY.neutralLight }}
                        onFocus={(e) => e.target.style.borderColor = LITAY.primary}
                        onBlur={(e) => e.target.style.borderColor = LITAY.neutralLight}>
                  <option>כל החודשים</option>
                  <option>ינואר</option>
                  <option>פברואר</option>
                  <option>מרץ</option>
                  <option>אפריל</option>
                  <option>מאי</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: LITAY.neutralDark }}>קטגוריה</label>
                <select className="w-full px-3 py-2.5 rounded-lg border-2 focus:outline-none transition-all" 
                        style={{ borderColor: LITAY.neutralLight }}
                        onFocus={(e) => e.target.style.borderColor = LITAY.primary}
                        onBlur={(e) => e.target.style.borderColor = LITAY.neutralLight}>
                  <option>כל הקטגוריות</option>
                  <option>הכנסות</option>
                  <option>הוצאות תפעול</option>
                  <option>הוצאות מימון</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: LITAY.neutralDark }}>סכום מינימלי</label>
                <input type="number" placeholder="0" className="w-full px-3 py-2.5 rounded-lg border-2 focus:outline-none transition-all" 
                       style={{ borderColor: LITAY.neutralLight }}
                       onFocus={(e) => e.target.style.borderColor = LITAY.primary}
                       onBlur={(e) => e.target.style.borderColor = LITAY.neutralLight} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: LITAY.neutralDark }}>סכום מקסימלי</label>
                <input type="number" placeholder="∞" className="w-full px-3 py-2.5 rounded-lg border-2 focus:outline-none transition-all" 
                       style={{ borderColor: LITAY.neutralLight }}
                       onFocus={(e) => e.target.style.borderColor = LITAY.primary}
                       onBlur={(e) => e.target.style.borderColor = LITAY.neutralLight} />
              </div>
            </div>
          )}
        </div>

        {/* Content Area - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Summary Cards */}
          <div className="lg:col-span-3 space-y-4">
            <SummaryCard
              title="סה״כ הכנסות"
              value="₪2,847,520"
              change="+12.3%"
              positive={true}
              icon="💰"
            />
            <SummaryCard
              title="סה״כ הוצאות"
              value="₪1,923,410"
              change="+8.7%"
              positive={false}
              icon="📊"
            />
            <SummaryCard
              title="רווח נקי"
              value="₪924,110"
              change="+18.5%"
              positive={true}
              icon="📈"
            />
            <SummaryCard
              title="% רווחיות"
              value="32.5%"
              change="+2.1%"
              positive={true}
              icon="🎯"
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200" style={{ borderRight: `4px solid ${LITAY.primary}` }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${LITAY.primary}20` }}>
                    {(() => {
                      const currentTab = tabs.find(t => t.id === selectedTab);
                      if (currentTab) {
                        const Icon = currentTab.icon;
                        return <Icon size={20} style={{ color: LITAY.primary }} />;
                      }
                      return null;
                    })()}
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: LITAY.primaryDark }}>
                    {tabs.find(t => t.id === selectedTab)?.label || "דוח"}
                  </h2>
                </div>
                
                {selectedTab === 'hierarchical' && <HierarchicalContent />}
                {selectedTab === 'pivot' && <PivotContent />}
                {selectedTab === 'quarterly' && <QuarterlyContent />}
                {selectedTab === 'raw' && <RawDataContent />}
              </div>
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
  );
}

// Summary Card Component - משופר
interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
}

function SummaryCard({ title, value, change, positive, icon }: SummaryCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer group border border-gray-200 relative overflow-hidden"
      style={{ borderRight: `4px solid ${LITAY.primary}` }}
    >
      {/* Hover Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" 
           style={{ background: `linear-gradient(135deg, ${LITAY.primary}, ${LITAY.primaryLight})` }} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: LITAY.neutralMedium }}>{title}</span>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-3xl font-bold mb-2" style={{ color: LITAY.primaryDark, fontFamily: 'Rubik, Arial' }}>
          {value}
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${positive ? 'bg-green-50' : 'bg-red-50'}`}
               style={{ color: positive ? LITAY.success : LITAY.error }}>
            <span>{change}</span>
            <span className="text-lg">{positive ? '↑' : '↓'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hierarchical Content
function HierarchicalContent() {
  const sections = [
    { title: "הכנסות", amount: "₪2,847,520", items: 12, color: LITAY.primary, icon: "💰" },
    { title: "עלות המכר", amount: "₪1,245,680", items: 8, color: LITAY.neutralMedium, icon: "📦" },
    { title: "הוצאות תפעול", amount: "₪523,490", items: 15, color: LITAY.neutralMedium, icon: "⚙️" },
    { title: "הוצאות מימון", amount: "₪154,240", items: 5, color: LITAY.neutralMedium, icon: "💳" }
  ];

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div 
          key={index} 
          className="rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group border border-gray-100"
          style={{ backgroundColor: LITAY.neutralBg, borderRight: `4px solid ${section.color}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl group-hover:scale-110 transition-transform">{section.icon}</div>
              <div>
                <h3 className="font-bold text-xl mb-1" style={{ color: LITAY.primaryDark }}>{section.title}</h3>
                <p className="text-sm font-medium" style={{ color: LITAY.neutralMedium }}>{section.items} פריטים</p>
              </div>
            </div>
            <div className="text-3xl font-bold group-hover:scale-105 transition-transform" 
                 style={{ color: section.color, fontFamily: 'Rubik, Arial' }}>
              {section.amount}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Pivot Content
function PivotContent() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: LITAY.neutralBg }}>
            <th className="px-4 py-4 text-right font-bold" style={{ color: LITAY.primaryDark }}>קטגוריה</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primaryDark }}>ינואר</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primaryDark }}>פברואר</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primaryDark }}>מרץ</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primaryDark }}>אפריל</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primaryDark }}>מאי</th>
            <th className="px-4 py-4 text-center font-bold" style={{ color: LITAY.primary }}>סה״כ</th>
          </tr>
        </thead>
        <tbody>
          {['הכנסות', 'הוצאות תפעול', 'הוצאות מימון', 'רווח נקי'].map((cat, i) => (
            <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: LITAY.neutralLight }}>
              <td className="px-4 py-4 font-semibold" style={{ color: LITAY.neutralDark }}>{cat}</td>
              <td className="px-4 py-4 text-center" style={{ fontFamily: 'Rubik, Arial', color: LITAY.neutralDark }}>₪{(Math.random() * 500000).toFixed(0)}</td>
              <td className="px-4 py-4 text-center" style={{ fontFamily: 'Rubik, Arial', color: LITAY.neutralDark }}>₪{(Math.random() * 500000).toFixed(0)}</td>
              <td className="px-4 py-4 text-center" style={{ fontFamily: 'Rubik, Arial', color: LITAY.neutralDark }}>₪{(Math.random() * 500000).toFixed(0)}</td>
              <td className="px-4 py-4 text-center" style={{ fontFamily: 'Rubik, Arial', color: LITAY.neutralDark }}>₪{(Math.random() * 500000).toFixed(0)}</td>
              <td className="px-4 py-4 text-center" style={{ fontFamily: 'Rubik, Arial', color: LITAY.neutralDark }}>₪{(Math.random() * 500000).toFixed(0)}</td>
              <td className="px-4 py-4 text-center font-bold" style={{ fontFamily: 'Rubik, Arial', color: LITAY.primary }}>₪{(Math.random() * 2500000).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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