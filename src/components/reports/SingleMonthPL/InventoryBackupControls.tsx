import React, { useState } from 'react';
import { Download, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';

// Types
interface Inventory {
  [month: number]: number;
}

interface InventoryData {
  opening: Inventory;
  closing: Inventory;
  lastSaved?: string;
}

// Main Component
export const InventoryBackupControls: React.FC<{
  openingInventory: Inventory;
  closingInventory: Inventory;
  onImport: (opening: Inventory, closing: Inventory) => void;
}> = ({ openingInventory, closingInventory, onImport }) => {
  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    const saved = localStorage.getItem('inventory_last_saved');
    return saved;
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export to JSON file
  const handleExport = () => {
    try {
      const data: InventoryData = {
        opening: openingInventory,
        closing: closingInventory,
        lastSaved: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `inventory_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'קובץ גיבוי הורד בהצלחה!');
    } catch (err) {
      showMessage('error', 'שגיאה בייצוא הנתונים');
    }
  };

  // Import from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: InventoryData = JSON.parse(content);

        if (!data.opening || !data.closing) {
          throw new Error('קובץ לא תקין');
        }

        onImport(data.opening, data.closing);
        showMessage('success', 'נתוני מלאי נטענו בהצלחה!');
      } catch (err) {
        showMessage('error', 'שגיאה בקריאת הקובץ - וודא שזה קובץ גיבוי תקין');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Save to localStorage
  const handleSave = () => {
    try {
      const data: InventoryData = {
        opening: openingInventory,
        closing: closingInventory,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('biurim_inventory', JSON.stringify(data));
      const saveTime = new Date().toLocaleString('he-IL');
      localStorage.setItem('inventory_last_saved', saveTime);
      setLastSaved(saveTime);

      showMessage('success', 'נתונים נשמרו בהצלחה!');
    } catch (err) {
      showMessage('error', 'שגיאה בשמירת הנתונים');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '12px',
      direction: 'rtl'
    }}>
      {/* כותרת */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div>
          <h4 style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            ניהול נתוני מלאי
          </h4>
          {lastSaved && (
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '12px', 
              color: '#6b7280' 
            }}>
              נשמר לאחרונה: {lastSaved}
            </p>
          )}
        </div>
      </div>

      {/* כפתורים */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* שמור מקומי */}
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
        >
          <Save size={14} />
          שמור מקומי
        </button>

        {/* ייצא גיבוי */}
        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          <Download size={14} />
          ייצא גיבוי
        </button>

        {/* ייבא מגיבוי */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
        >
          <Upload size={14} />
          ייבא מגיבוי
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* הודעות */}
      {message && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: message.type === 'success' ? '#065f46' : '#991b1b'
        }}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* הסבר */}
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>💡 חשוב:</strong> 
        <ul style={{ margin: '4px 0 0 0', paddingRight: '20px' }}>
          <li><strong>שמור מקומי</strong> - שומר בדפדפן (יעלם אם תנקה cache)</li>
          <li><strong>ייצא גיבוי</strong> - שומר קובץ JSON למחשב שלך (מומלץ!)</li>
          <li><strong>ייבא מגיבוי</strong> - טוען קובץ JSON שייצאת בעבר</li>
        </ul>
      </div>
    </div>
  );
};

// Demo Component
export default function Demo() {
  const [openingInventory, setOpeningInventory] = useState<Inventory>({
    5: 650000,
    6: 680000,
    7: 700000,
    8: 690000,
    9: 0
  });

  const [closingInventory, setClosingInventory] = useState<Inventory>({
    5: 680000,
    6: 700000,
    7: 690000,
    8: 670000,
    9: 0
  });

  const handleImport = (opening: Inventory, closing: Inventory) => {
    setOpeningInventory(opening);
    setClosingInventory(closing);
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#1f2937' }}>
        דוגמה - קומפוננטת גיבוי נתוני מלאי
      </h1>

      <InventoryBackupControls
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        onImport={handleImport}
      />

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>מלאי פתיחה:</h3>
        <pre style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(openingInventory, null, 2)}
        </pre>

        <h3>מלאי סגירה:</h3>
        <pre style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(closingInventory, null, 2)}
        </pre>
      </div>
    </div>
  );
}