// פלטת צבעים של ליתאי
const LITAY = {
  primaryDark: '#2d5f3f',
  primary: '#528163',
  primaryLight: '#8dd1bb',
  neutralDark: '#2d3436',
  neutralMedium: '#636e72',
  neutralLight: '#b2bec3',
  neutralBg: '#f5f6fa',
  white: '#ffffff',
  success: '#27ae60',
  error: '#e74c3c',
};

interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  onClick?: () => void;
}

export default function SummaryCard({ 
  title, 
  value, 
  change, 
  positive, 
  icon,
  onClick 
}: SummaryCardProps) {
  return (
    <div 
      className={`bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-2xl hover:-translate-y-1 group border border-gray-200 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        borderRight: `4px solid ${LITAY.primary}`,
        fontFamily: 'Assistant, Heebo, Arial Hebrew, sans-serif'
      }}
      onClick={onClick}
    >
      {/* Hover Background Effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" 
        style={{ 
          background: `linear-gradient(135deg, ${LITAY.primary}, ${LITAY.primaryLight})` 
        }} 
      />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span 
            className="text-sm font-semibold" 
            style={{ color: LITAY.neutralMedium }}
          >
            {title}
          </span>
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {icon}
          </span>
        </div>

        {/* Value */}
        <div 
          className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform" 
          style={{ 
            color: LITAY.primaryDark, 
            fontFamily: 'Rubik, Arial' 
          }}
        >
          {value}
        </div>

        {/* Change Badge */}
        <div className="flex items-center gap-2">
          <div 
            className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${positive ? 'bg-green-50' : 'bg-red-50'}`}
            style={{ color: positive ? LITAY.success : LITAY.error }}
          >
            <span>{change}</span>
            <span className="text-lg">{positive ? '↑' : '↓'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}