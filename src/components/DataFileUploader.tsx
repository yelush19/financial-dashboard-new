// src/components/DataFileUploader.tsx
// רכיב להעלאת קבצי נתונים (Transactions & Balance) מהמחשב

import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useDataContext } from '../contexts/DataContext';
import { saveCSVFile } from '../utils/csvStorage';

type FileType = 'transactions' | 'balance';

interface FileStatus {
  transactions: 'pending' | 'uploading' | 'success' | 'error';
  balance: 'pending' | 'uploading' | 'success' | 'error';
}

export const DataFileUploader: React.FC = () => {
  const { setTransactionsData, setBalanceData } = useDataContext();
  const [fileStatus, setFileStatus] = useState<FileStatus>({
    transactions: 'pending',
    balance: 'pending',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transactionsInputRef = useRef<HTMLInputElement>(null);
  const balanceInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: FileType
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setFileStatus((prev) => ({ ...prev, [fileType]: 'uploading' }));
      setErrorMessage(null);

      // קריאת הקובץ
      const text = await file.text();

      // שמירה ב-Context ו-localStorage
      if (fileType === 'transactions') {
        setTransactionsData(text);
      } else {
        setBalanceData(text);
      }

      // שמירה ב-localStorage דרך הפונקציה המרכזית
      await saveCSVFile(fileType, text);

      setFileStatus((prev) => ({ ...prev, [fileType]: 'success' }));
    } catch (error) {
      setFileStatus((prev) => ({ ...prev, [fileType]: 'error' }));
      setErrorMessage(`שגיאה בטעינת ${fileType === 'transactions' ? 'תנועות' : 'מאזן'}: ${error}`);
    } finally {
      // איפוס input
      if (fileType === 'transactions' && transactionsInputRef.current) {
        transactionsInputRef.current.value = '';
      } else if (fileType === 'balance' && balanceInputRef.current) {
        balanceInputRef.current.value = '';
      }
    }
  };

  const getStatusIcon = (status: FileStatus[FileType]) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: FileStatus[FileType], fileName: string) => {
    switch (status) {
      case 'uploading':
        return 'טוען...';
      case 'success':
        return 'נטען בהצלחה';
      case 'error':
        return 'שגיאה בטעינה';
      default:
        return `העלה ${fileName}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">העלאת קבצי נתונים</h2>

      <div className="space-y-3">
        {/* Transactions File */}
        <div className="border rounded-lg p-4">
          <input
            ref={transactionsInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e, 'transactions')}
            className="hidden"
            id="transactions-file-input"
            disabled={fileStatus.transactions === 'uploading'}
          />

          <label htmlFor="transactions-file-input">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {getStatusIcon(fileStatus.transactions)}
                <div>
                  <p className="font-medium text-gray-800">קובץ תנועות</p>
                  <p className="text-sm text-gray-500">TransactionMonthlyModi.csv</p>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-lg transition-colors ${
                fileStatus.transactions === 'uploading'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : fileStatus.transactions === 'success'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}>
                <Upload className="w-4 h-4 inline mr-2" />
                {getStatusText(fileStatus.transactions, 'קובץ תנועות')}
              </div>
            </div>
          </label>
        </div>

        {/* Balance File */}
        <div className="border rounded-lg p-4">
          <input
            ref={balanceInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e, 'balance')}
            className="hidden"
            id="balance-file-input"
            disabled={fileStatus.balance === 'uploading'}
          />

          <label htmlFor="balance-file-input">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {getStatusIcon(fileStatus.balance)}
                <div>
                  <p className="font-medium text-gray-800">קובץ מאזן בוחן</p>
                  <p className="text-sm text-gray-500">BalanceMonthlyModi.csv</p>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-lg transition-colors ${
                fileStatus.balance === 'uploading'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : fileStatus.balance === 'success'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}>
                <Upload className="w-4 h-4 inline mr-2" />
                {getStatusText(fileStatus.balance, 'מאזן בוחן')}
              </div>
            </div>
          </label>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {fileStatus.transactions === 'success' && fileStatus.balance === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>כל הקבצים נטענו בהצלחה! המערכת מוכנה לשימוש.</span>
        </div>
      )}
    </div>
  );
};
