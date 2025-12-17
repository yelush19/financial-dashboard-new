// src/components/ImportAdjustmentsButton.tsx
// כפתור לייבוא התאמות מקובץ CSV - העלאה מאובטחת ממחשב המשתמש

import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { parseAdjustmentsCSV, uploadAdjustmentsToSupabase } from '../utils/adjustmentsImporter';

interface ImportAdjustmentsButtonProps {
  onImportComplete?: () => void;
  className?: string;
}

export const ImportAdjustmentsButton: React.FC<ImportAdjustmentsButtonProps> = ({
  onImportComplete,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage(null);

      // קריאת הקובץ
      const text = await file.text();

      // ניתוח
      const adjustments = parseAdjustmentsCSV(text);

      if (adjustments.length === 0) {
        setMessage({
          type: 'error',
          text: 'לא נמצאו התאמות תקינות בקובץ'
        });
        return;
      }

      // העלאה ל-Supabase
      const result = await uploadAdjustmentsToSupabase(adjustments);

      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.success
          ? `נטענו בהצלחה ${result.count} התאמות`
          : `נטענו ${result.count} התאמות עם ${result.errors.length} שגיאות`
      });

      if (result.success && onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 1000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה: ${error}`
      });
    } finally {
      setLoading(false);

      // איפוס input למקרה של העלאה חוזרת של אותו קובץ
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="adjustments-file-input"
      />

      <label htmlFor="adjustments-file-input">
        <div
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              מעלה ומעבד...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              העלה קובץ התאמות (CSV)
            </>
          )}
        </div>
      </label>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
