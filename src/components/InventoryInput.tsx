import React, { useState, useEffect } from 'react';
import { Save, Loader2, Edit2, Lock, AlertCircle } from 'lucide-react';

interface InventoryInputProps {
  accountKey: number;
  accountName: string;
  year: number;
  month?: number; // אם אין - זה מלאי שנתי
  openingValue: number;
  closingValue: number;
  onSaveOpening: (amount: number) => Promise<boolean>;
  onSaveClosing: (amount: number) => Promise<boolean>;
  saving?: boolean;
  disabled?: boolean;
  autoOpeningFromPrevMonth?: boolean; // האם מלאי פתיחה אוטומטי מחודש קודם
}

export const InventoryInput: React.FC<InventoryInputProps> = ({
  accountKey,
  accountName,
  year,
  month,
  openingValue,
  closingValue,
  onSaveOpening,
  onSaveClosing,
  saving = false,
  disabled = false,
  autoOpeningFromPrevMonth = true
}) => {
  const [opening, setOpening] = useState<string>(openingValue.toString());
  const [closing, setClosing] = useState<string>(closingValue.toString());
  const [editingOpening, setEditingOpening] = useState<boolean>(false);
  const [editingClosing, setEditingClosing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // עדכון ערכים כאשר הם משתנים מבחוץ
  useEffect(() => {
    setOpening(openingValue.toString());
  }, [openingValue]);

  useEffect(() => {
    setClosing(closingValue.toString());
  }, [closingValue]);

  // שמירת מלאי פתיחה
  const handleSaveOpening = async () => {
    const amount = parseFloat(opening);
    if (isNaN(amount)) {
      setSaveError('ערך לא תקין');
      return;
    }

    const success = await onSaveOpening(amount);
    if (success) {
      setSaveSuccess('מלאי פתיחה נשמר');
      setEditingOpening(false);
      setTimeout(() => setSaveSuccess(null), 2000);
    } else {
      setSaveError('שגיאה בשמירה');
      setTimeout(() => setSaveError(null), 2000);
    }
  };

  // שמירת מלאי סגירה
  const handleSaveClosing = async () => {
    const amount = parseFloat(closing);
    if (isNaN(amount)) {
      setSaveError('ערך לא תקין');
      return;
    }

    const success = await onSaveClosing(amount);
    if (success) {
      setSaveSuccess('מלאי סגירה נשמר (ומלאי פתיחה לחודש הבא עודכן)');
      setEditingClosing(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    } else {
      setSaveError('שגיאה בשמירה');
      setTimeout(() => setSaveError(null), 2000);
    }
  };

  const isMonthly = month !== undefined;
  const monthName = month ? new Date(year, month - 1).toLocaleDateString('he-IL', { month: 'long' }) : '';

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 shadow-sm border border-green-200">
      {/* כותרת */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-green-900">
            {accountName} ({accountKey})
          </h4>
          <p className="text-xs text-green-700">
            {isMonthly ? `${monthName} ${year}` : `שנת ${year}`}
          </p>
        </div>
        {saving && (
          <Loader2 className="animate-spin text-green-600" size={20} />
        )}
      </div>

      {/* הודעות */}
      {saveSuccess && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800 flex items-center gap-2">
          <AlertCircle size={14} />
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* מלאי פתיחה */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-green-800 flex items-center gap-1">
            מלאי פתיחה
            {autoOpeningFromPrevMonth && isMonthly && month > 1 && (
              <span title="מחושב אוטומטי מחודש קודם">
                <Lock size={12} className="text-green-600" />
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              disabled={disabled || saving || !editingOpening}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                editingOpening
                  ? 'border-green-500 bg-white'
                  : 'border-gray-300 bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="0"
              step="0.01"
            />
            {!editingOpening ? (
              <button
                onClick={() => setEditingOpening(true)}
                disabled={disabled || saving}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                title="ערוך מלאי פתיחה"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveOpening}
                disabled={disabled || saving}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="שמור מלאי פתיחה"
              >
                <Save size={16} />
              </button>
            )}
          </div>
        </div>

        {/* מלאי סגירה */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-green-800">
            מלאי סגירה
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              disabled={disabled || saving || !editingClosing}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                editingClosing
                  ? 'border-green-500 bg-white'
                  : 'border-gray-300 bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="0"
              step="0.01"
            />
            {!editingClosing ? (
              <button
                onClick={() => setEditingClosing(true)}
                disabled={disabled || saving}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                title="ערוך מלאי סגירה"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveClosing}
                disabled={disabled || saving}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="שמור מלאי סגירה"
              >
                <Save size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* חישוב עלות מכר */}
      <div className="mt-3 pt-3 border-t border-green-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-700 font-semibold">נוסחת עלות מכר:</span>
          <span className="text-green-900 font-mono">
            פתיחה ({parseFloat(opening).toLocaleString('he-IL')}) + רכישות - סגירה ({parseFloat(closing).toLocaleString('he-IL')})
          </span>
        </div>
      </div>
    </div>
  );
};

// ===============================
// קומפוננטה להתאמות שנה קודמת
// ===============================

interface PriorYearAdjustmentInputProps {
  accountKey: number;
  accountName: string;
  currentYear: number;
  priorYear: number;
  adjustmentValue: number;
  onSave: (amount: number) => Promise<boolean>;
  saving?: boolean;
  disabled?: boolean;
}

export const PriorYearAdjustmentInput: React.FC<PriorYearAdjustmentInputProps> = ({
  accountKey,
  accountName,
  currentYear,
  priorYear,
  adjustmentValue,
  onSave,
  saving = false,
  disabled = false
}) => {
  const [adjustment, setAdjustment] = useState<string>(adjustmentValue.toString());
  const [editing, setEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setAdjustment(adjustmentValue.toString());
  }, [adjustmentValue]);

  const handleSave = async () => {
    const amount = parseFloat(adjustment);
    if (isNaN(amount)) {
      setSaveError('ערך לא תקין');
      return;
    }

    const success = await onSave(amount);
    if (success) {
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } else {
      setSaveError('שגיאה בשמירה');
      setTimeout(() => setSaveError(null), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-blue-200">
      {/* כותרת */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            התאמות {priorYear} - {accountName} ({accountKey})
          </h4>
          <p className="text-xs text-blue-700">
            משפיע על שנת {currentYear}
          </p>
        </div>
        {saving && (
          <Loader2 className="animate-spin text-blue-600" size={20} />
        )}
      </div>

      {/* הודעות */}
      {saveSuccess && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800 flex items-center gap-2">
          <AlertCircle size={14} />
          התאמה נשמרה בהצלחה
        </div>
      )}
      {saveError && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          {saveError}
        </div>
      )}

      {/* שדה קלט */}
      <div className="flex gap-2">
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          disabled={disabled || saving || !editing}
          className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
            editing
              ? 'border-blue-500 bg-white'
              : 'border-gray-300 bg-gray-50'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="0"
          step="0.01"
        />
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            disabled={disabled || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Edit2 size={16} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={disabled || saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default InventoryInput;