// תוספת ל-index.tsx - הוסף את זה אחרי כל ה-imports הקיימים:

import { AccountRow } from './AccountRow';
import { TransactionRow } from './TransactionRow';

// תוספת ל-State (אחרי const [expandedCategories...]):
const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

// הוסף את הפונקציות האלה לפני הרנדור (אחרי useMemo):

const toggleAccount = (categoryCode: string, accountKey: number) => {
  const key = `${categoryCode}_${accountKey}`;
  const newSet = new Set(expandedAccounts);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  setExpandedAccounts(newSet);
};

const toggleVendor = (categoryCode: string, accountKey: number, vendorName: string) => {
  const key = `${categoryCode}_${accountKey}_${vendorName}`;
  const newSet = new Set(expandedVendors);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  setExpandedVendors(newSet);
};

const getAccountsForCategory = (category: CategoryData) => {
  let categoryTxs: Transaction[];
  
  if (category.code === 'income_site') {
    categoryTxs = transactions.filter(tx => 
      tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020
    );
  } else if (category.code === 'income_superpharm') {
    categoryTxs = transactions.filter(tx => 
      tx.sortCode === 600 && tx.accountKey >= 40020
    );
  } else {
    categoryTxs = transactions.filter(tx => tx.sortCode === category.code);
  }

  const accountGroups = _.groupBy(categoryTxs, tx => 
    `${tx.accountKey}|||${tx.accountName}`
  );

  return Object.entries(accountGroups).map(([key, txs]) => {
    const [accountKey, accountName] = key.split('|||');
    const accountData: any = { total: 0 };
    
    monthlyData.months.forEach(m => {
      accountData[m] = txs
        .filter(tx => parseInt(tx.date.split('/')[1]) === m)
        .reduce((sum, tx) => sum + tx.amount, 0);
      accountData.total += accountData[m];
    });

    const vendorGroups = _.groupBy(txs, tx => {
      const counterNum = tx.counterAccountNumber || 0;
      const counterName = tx.counterAccountName || 'לא ידוע';
      return `${counterNum}|||${counterName}`;
    });

    return {
      accountKey: parseInt(accountKey),
      accountName,
      data: accountData,
      vendorCount: Object.keys(vendorGroups).length,
      transactions: txs
    };
  }).sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));
};

const getVendorsForAccount = (category: CategoryData, accountKey: number) => {
  let accountTxs = transactions.filter(tx => tx.accountKey === accountKey);
  
  if (category.code === 'income_site') {
    accountTxs = accountTxs.filter(tx => 
      tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020
    );
  } else if (category.code === 'income_superpharm') {
    accountTxs = accountTxs.filter(tx => 
      tx.sortCode === 600 && tx.accountKey >= 40020
    );
  } else {
    accountTxs = accountTxs.filter(tx => tx.sortCode === category.code);
  }

  const vendorGroups = _.groupBy(accountTxs, tx => {
    const counterNum = tx.counterAccountNumber || 0;
    const counterName = tx.counterAccountName || 'לא ידוע';
    return `${counterNum}|||${counterName}`;
  });

  return Object.entries(vendorGroups).map(([key, txs]) => {
    const [counterNum, counterName] = key.split('|||');
    const vendorData: any = { total: 0 };
    
    monthlyData.months.forEach(m => {
      vendorData[m] = (txs as Transaction[])
        .filter(tx => parseInt(tx.date.split('/')[1]) === m)
        .reduce((sum, tx) => sum + tx.amount, 0);
      vendorData.total += vendorData[m];
    });

    return {
      name: counterNum && counterNum !== '0' ? `${counterName} - ${counterNum}` : counterName,
      data: vendorData,
      transactions: txs as Transaction[]
    };
  }).sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));
};

// החלף את החלק הזה בקוד שלך (מתחיל ב-{!collapsedSections.has('income') && ...):

{!collapsedSections.has('income') && monthlyData.categories.filter(c => c.type === 'income').map(cat => {
  const categoryKey = String(cat.code);
  const isCategoryExpanded = expandedCategories.has(categoryKey);
  const accounts = isCategoryExpanded ? getAccountsForCategory(cat) : [];

  return (
    <React.Fragment key={cat.code}>
      <CategoryRow
        category={cat}
        months={monthlyData.months}
        isExpanded={isCategoryExpanded}
        onToggle={() => toggleCategory(categoryKey)}
        onShowBiur={(month) => month ? handleDrillDown(cat, month) : showBiur(cat)}
        formatCurrency={formatCurrency}
        colorClass="text-green-700"
        onShowScrollDrill={(month, monthName) => 
          handleShowScrollDrill(cat.code, cat.name, month, monthName)
        }
      />
      
      {isCategoryExpanded && accounts.map(account => {
        const accountKey = `${categoryKey}_${account.accountKey}`;
        const isAccountExpanded = expandedAccounts.has(accountKey);
        const vendors = isAccountExpanded ? getVendorsForAccount(cat, account.accountKey) : [];

        return (
          <React.Fragment key={accountKey}>
            <AccountRow
              account={account}
              months={monthlyData.months}
              isExpanded={isAccountExpanded}
              onToggle={() => toggleAccount(categoryKey, account.accountKey)}
              formatCurrency={formatCurrency}
              categoryType={cat.type}
              bgColor="bg-gray-50"
            />

            {isAccountExpanded && vendors.map((vendor, vIdx) => {
              const vendorKey = `${accountKey}_${vendor.name}`;
              const isVendorExpanded = expandedVendors.has(vendorKey);

              return (
                <React.Fragment key={`${vendorKey}_${vIdx}`}>
                  <VendorRow
                    vendor={vendor}
                    category={cat}
                    months={monthlyData.months}
                    isExpanded={isVendorExpanded}
                    onToggle={() => toggleVendor(categoryKey, account.accountKey, vendor.name)}
                    formatCurrency={formatCurrency}
                    bgColor="bg-gray-100"
                  />

                  {isVendorExpanded && vendor.transactions.map((tx, txIdx) => (
                    <TransactionRow
                      key={`${vendorKey}_tx_${txIdx}`}
                      transaction={tx}
                      formatCurrency={formatCurrency}
                      categoryType={cat.type}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
})}