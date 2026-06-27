import { TemplateInfo, FormulaLearningModule } from './types';

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'inventory',
    name: 'Inventory',
    descriptionEnglish: 'Track opening stock, purchases, sales, and closing stock with unit prices.',
    descriptionUrdu: 'Opening stock, purchases, sales, closing stock aur unit price track karne ke liye template.',
    requiredColumns: [
      'Item Code',
      'Item Name',
      'Category',
      'Opening Stock',
      'Purchases',
      'Sales',
      'Closing Stock',
      'Unit Price'
    ],
    sampleData: [
      {
        'Item Code': 'INV001',
        'Item Name': 'Laptop Air 13',
        'Category': 'Electronics',
        'Opening Stock': 50,
        'Purchases': 20,
        'Sales': 15,
        'Closing Stock': 55, // =Opening + Purchases - Sales
        'Unit Price': 120000
      },
      {
        'Item Code': 'INV002',
        'Item Name': 'Smart Screen Pro',
        'Category': 'Electronics',
        'Opening Stock': 30,
        'Purchases': 10,
        'Sales': 12,
        'Closing Stock': 28,
        'Unit Price': 45000
      },
      {
        'Item Code': 'INV003',
        'Item Name': 'Wireless Mouse',
        'Category': 'Accessories',
        'Opening Stock': 150,
        'Purchases': 50,
        'Sales': 80,
        'Closing Stock': 120,
        'Unit Price': 2500
      }
    ]
  },
  {
    id: 'payroll',
    name: 'Payroll',
    descriptionEnglish: 'Calculate employee salaries, overtime, allowances, deductions, and net salary.',
    descriptionUrdu: 'Employee basic salary, allowance, overtime, deductions aur net salary nikalne ke liye template.',
    requiredColumns: [
      'Employee ID',
      'Employee Name',
      'Designation',
      'Basic Salary',
      'Allowance',
      'Overtime Hours',
      'Overtime Rate',
      'Deductions',
      'Net Salary'
    ],
    sampleData: [
      {
        'Employee ID': 'EMP101',
        'Employee Name': 'Ahmad Raza',
        'Designation': 'Senior Developer',
        'Basic Salary': 150000,
        'Allowance': 20000,
        'Overtime Hours': 10,
        'Overtime Rate': 1000,
        'Deductions': 5000,
        'Net Salary': 175000 // =Basic + Allowance + (Overtime Hours * Overtime Rate) - Deductions
      },
      {
        'Employee ID': 'EMP102',
        'Employee Name': 'Sana Khan',
        'Designation': 'UI Designer',
        'Basic Salary': 120000,
        'Allowance': 15000,
        'Overtime Hours': 5,
        'Overtime Rate': 800,
        'Deductions': 3000,
        'Net Salary': 136000
      },
      {
        'Employee ID': 'EMP103',
        'Employee Name': 'Ali Shan',
        'Designation': 'Support Agent',
        'Basic Salary': 50000,
        'Allowance': 5000,
        'Overtime Hours': 12,
        'Overtime Rate': 500,
        'Deductions': 1500,
        'Net Salary': 59500
      }
    ]
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss',
    descriptionEnglish: 'Determine Gross Profit and Net Profit by tracking revenue and operational expenses.',
    descriptionUrdu: 'Revenue, Cost of Goods, Operating expenses, Gross profit, aur Net profit track karne ke liye template.',
    requiredColumns: [
      'Date',
      'Particulars',
      'Revenue',
      'Cost of Goods Sold',
      'Operating Expenses',
      'Gross Profit',
      'Net Profit'
    ],
    sampleData: [
      {
        'Date': '2026-06-01',
        'Particulars': 'Product Sales Retail',
        'Revenue': 500000,
        'Cost of Goods Sold': 200000,
        'Operating Expenses': 80000,
        'Gross Profit': 300000, // =Revenue - Cost of Goods Sold
        'Net Profit': 220000   // =Gross Profit - Operating Expenses
      },
      {
        'Date': '2026-06-02',
        'Particulars': 'Corporate Subscriptions',
        'Revenue': 300000,
        'Cost of Goods Sold': 50000,
        'Operating Expenses': 40000,
        'Gross Profit': 250000,
        'Net Profit': 210000
      },
      {
        'Date': '2026-06-03',
        'Particulars': 'Consulting Services',
        'Revenue': 150000,
        'Cost of Goods Sold': 0,
        'Operating Expenses': 20000,
        'Gross Profit': 150000,
        'Net Profit': 130000
      }
    ]
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    descriptionEnglish: 'List assets, liabilities, and shareholder equity to review the financial position.',
    descriptionUrdu: 'Karobaar ke Assets, Liabilities aur Shareholder Equity ka khulasa rakhne ke liye template.',
    requiredColumns: [
      'Category',
      'Account Name',
      'Amount'
    ],
    sampleData: [
      { 'Category': 'Assets', 'Account Name': 'Cash & Equivalents', 'Amount': 450000 },
      { 'Category': 'Assets', 'Account Name': 'Accounts Receivable', 'Amount': 120000 },
      { 'Category': 'Assets', 'Account Name': 'Equipment', 'Amount': 350000 },
      { 'Category': 'Liabilities', 'Account Name': 'Accounts Payable', 'Amount': 90000 },
      { 'Category': 'Liabilities', 'Account Name': 'Short-term Loan', 'Amount': 150000 },
      { 'Category': 'Equity', 'Account Name': 'Retained Earnings', 'Amount': 680000 }
    ]
  },
  {
    id: 'cash-book',
    name: 'Cash Book',
    descriptionEnglish: 'Maintain daily records of cash receipts (In) and cash payments (Out) with a running balance.',
    descriptionUrdu: 'Rozana cash receipts (In) aur cash payments (Out) ka record running balance ke sath rakhne ke liye template.',
    requiredColumns: [
      'Date',
      'Description',
      'Cash In',
      'Cash Out',
      'Balance'
    ],
    sampleData: [
      { 'Date': '2026-06-25', 'Description': 'Opening Balance', 'Cash In': 100000, 'Cash Out': 0, 'Balance': 100000 },
      { 'Date': '2026-06-25', 'Description': 'Office Rent Paid', 'Cash In': 0, 'Cash Out': 25000, 'Balance': 75000 },
      { 'Date': '2026-06-26', 'Description': 'Client Payment Received', 'Cash In': 45000, 'Cash Out': 0, 'Balance': 120000 },
      { 'Date': '2026-06-27', 'Description': 'Office Stationery Purchases', 'Cash In': 0, 'Cash Out': 3500, 'Balance': 116500 }
    ]
  },
  {
    id: 'sales-report',
    name: 'Sales Report',
    descriptionEnglish: 'Track customer orders, calculated quantities, sales prices, discounts, and net amounts.',
    descriptionUrdu: 'Customer orders, quantites, sales prices, discounts aur total net sales amount track karne ke liye template.',
    requiredColumns: [
      'Invoice No',
      'Customer Name',
      'Product Name',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Discount',
      'Net Amount'
    ],
    sampleData: [
      {
        'Invoice No': 'INV-1001',
        'Customer Name': 'Zeeshan Malik',
        'Product Name': 'Wireless Earbuds',
        'Quantity': 3,
        'Unit Price': 4000,
        'Total Amount': 12000, // =Quantity * Unit Price
        'Discount': 1000,
        'Net Amount': 11000 // =Total Amount - Discount
      },
      {
        'Invoice No': 'INV-1002',
        'Customer Name': 'Maria Yusuf',
        'Product Name': 'Leather Bag',
        'Quantity': 1,
        'Unit Price': 8500,
        'Total Amount': 8500,
        'Discount': 500,
        'Net Amount': 8000
      },
      {
        'Invoice No': 'INV-1003',
        'Customer Name': 'Farhan Ahmed',
        'Product Name': 'Sleek Keyboard',
        'Quantity': 2,
        'Unit Price': 3000,
        'Total Amount': 6000,
        'Discount': 0,
        'Net Amount': 6000
      }
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance',
    descriptionEnglish: 'Record total working days, presents, absents, leaves, and attendance percentage.',
    descriptionUrdu: ' मुलाज़िम ke total working days, present, absent aur attendance percentage report template.',
    requiredColumns: [
      'Employee ID',
      'Employee Name',
      'Total Days',
      'Present',
      'Absent',
      'Leaves',
      'Attendance Percentage'
    ],
    sampleData: [
      {
        'Employee ID': 'EMP101',
        'Employee Name': 'Ahmad Raza',
        'Total Days': 26,
        'Present': 24,
        'Absent': 1,
        'Leaves': 1,
        'Attendance Percentage': 92.3 // = (Present / Total Days) * 100
      },
      {
        'Employee ID': 'EMP102',
        'Employee Name': 'Sana Khan',
        'Total Days': 26,
        'Present': 25,
        'Absent': 0,
        'Leaves': 1,
        'Attendance Percentage': 96.2
      },
      {
        'Employee ID': 'EMP103',
        'Employee Name': 'Ali Shan',
        'Total Days': 26,
        'Present': 22,
        'Absent': 4,
        'Leaves': 0,
        'Attendance Percentage': 84.6
      }
    ]
  },
  {
    id: 'budget',
    name: 'Budget',
    descriptionEnglish: 'Compare planned budget with actual spent to compute budget variance.',
    descriptionUrdu: 'Category wise planned budget, actual spending, aur variance (planned - actual) calculate karne ke liye template.',
    requiredColumns: [
      'Category',
      'Planned Budget',
      'Actual Spent',
      'Variance'
    ],
    sampleData: [
      { 'Category': 'Marketing', 'Planned Budget': 120000, 'Actual Spent': 135000, 'Variance': -15000 }, // =Planned - Actual
      { 'Category': 'Office Operations', 'Planned Budget': 80000, 'Actual Spent': 72000, 'Variance': 8000 },
      { 'Category': 'Employee Welfare', 'Planned Budget': 30000, 'Actual Spent': 25000, 'Variance': 5000 },
      { 'Category': 'Software Licenses', 'Planned Budget': 50000, 'Actual Spent': 51200, 'Variance': -1200 }
    ]
  },
  {
    id: 'gst-vat',
    name: 'GST / VAT Calculation',
    descriptionEnglish: 'Calculate standard tax percentages, tax amounts, and total gross amounts.',
    descriptionUrdu: 'Item price par GST/VAT calculation, tax amount aur total invoice value nikalne ki template.',
    requiredColumns: [
      'Item Description',
      'Amount',
      'Tax Rate (%)',
      'Tax Amount',
      'Total with Tax'
    ],
    sampleData: [
      {
        'Item Description': 'Office Desk Chair',
        'Amount': 15000,
        'Tax Rate (%)': 18,
        'Tax Amount': 2700, // = Amount * (Tax Rate / 100)
        'Total with Tax': 17700 // = Amount + Tax Amount
      },
      {
        'Item Description': 'HP LaserJet Printer',
        'Amount': 38000,
        'Tax Rate (%)': 18,
        'Tax Amount': 6840,
        'Total with Tax': 44840
      },
      {
        'Item Description': 'Conference Table',
        'Amount': 85000,
        'Tax Rate (%)': 12,
        'Tax Amount': 10200,
        'Total with Tax': 95200
      }
    ]
  },
  {
    id: 'bank-reconciliation',
    name: 'Bank Reconciliation',
    descriptionEnglish: 'Match bank statement balances with general ledger ledger book balance to catch differences.',
    descriptionUrdu: 'Bank statement balance aur Ledger book balance ko aapas me match kar ke reconciliation template.',
    requiredColumns: [
      'Date',
      'Transaction Description',
      'Bank Statement Balance',
      'Ledger Balance',
      'Difference',
      'Status'
    ],
    sampleData: [
      {
        'Date': '2026-06-20',
        'Transaction Description': 'HBL Invoice Collection',
        'Bank Statement Balance': 250000,
        'Ledger Balance': 250000,
        'Difference': 0, // = Bank Statement Balance - Ledger Balance
        'Status': 'Matched'
      },
      {
        'Date': '2026-06-22',
        'Transaction Description': 'Unpresented vendor cheque',
        'Bank Statement Balance': 180000,
        'Ledger Balance': 230000,
        'Difference': -50000,
        'Status': 'Pending Bank Update'
      },
      {
        'Date': '2026-06-25',
        'Transaction Description': 'Direct Bank Charge fee',
        'Bank Statement Balance': 148500,
        'Ledger Balance': 150000,
        'Difference': -1500,
        'Status': 'Awaiting Ledger Entry'
      }
    ]
  },
  {
    id: 'fixed-assets',
    name: 'Fixed Assets Register',
    descriptionEnglish: 'Record historical assets cost, depreciation rates, and calculate accumulated depreciation and net book value.',
    descriptionUrdu: 'Assets ki khareed ke bad depreciation rate, accumulated depreciation, aur current Book Value track karne ka register.',
    requiredColumns: [
      'Asset ID',
      'Asset Name',
      'Purchase Date',
      'Cost',
      'Depreciation Rate (%)',
      'Accumulated Depreciation',
      'Book Value'
    ],
    sampleData: [
      {
        'Asset ID': 'AST-401',
        'Asset Name': 'Delivery Bike Honda 70',
        'Purchase Date': '2024-01-15',
        'Cost': 110000,
        'Depreciation Rate (%)': 15,
        'Accumulated Depreciation': 33000, // = Cost * (Rate/100) * 2 years
        'Book Value': 77000 // = Cost - Accumulated Depreciation
      },
      {
        'Asset ID': 'AST-402',
        'Asset Name': 'Executive Conference AC',
        'Purchase Date': '2025-06-10',
        'Cost': 180000,
        'Depreciation Rate (%)': 10,
        'Accumulated Depreciation': 18000,
        'Book Value': 162000
      }
    ]
  }
];

export const FORMULAS_LEARNING: FormulaLearningModule[] = [
  {
    id: 'sum',
    name: 'SUM (جمع کرنا)',
    category: 'Basic',
    whatItDoesEnglish: 'Adds all the numbers in a range of cells.',
    whatItDoesUrdu: 'Diye gaye cells ke range me mojood tamam numbers ko jama (add) karta hai.',
    dataStructureEnglish: 'A column or row of numeric values without empty cells or text inside target formulas.',
    dataStructureUrdu: 'Numeric numbers ka column ya row, jismay text ke bajaye sirf numbers hon.',
    commonMistakesEnglish: 'Including text columns in the range, or having "#VALUE!" errors due to unformatted numbers.',
    commonMistakesUrdu: 'Range me galti se text wale columns ko shamil karna ya non-numeric format hona.',
    formulaTemplate: '=SUM(StartCell:EndCell)',
    practiceQuestionEnglish: 'Write a SUM formula to calculate the total amount of these items.',
    practiceQuestionUrdu: 'Tamam items ki total price calculate karne ke liye SUM formula likhein.',
    practiceData: [
      { 'Item': 'Keyboard', 'Price': 1500 },
      { 'Item': 'Mouse', 'Price': 800 },
      { 'Item': 'Monitor', 'Price': 12000 },
      { 'Item': 'Cables', 'Price': 400 }
    ],
    practiceExpectedAnswer: '14700',
    practiceValidationExpression: 'SUM'
  },
  {
    id: 'average',
    name: 'AVERAGE (اوسط نکالنا)',
    category: 'Basic',
    whatItDoesEnglish: 'Calculates the arithmetic mean of a range of cells.',
    whatItDoesUrdu: 'Cells ke range me mojood values ki arithmetic average (اوسط) nikalta hai.',
    dataStructureEnglish: 'Columns or rows of numerical cells that represent values like sales, scores, or measurements.',
    dataStructureUrdu: 'Numbers ka group jinka average nikalna ho, maslan daily sales ya salary.',
    commonMistakesEnglish: 'Zero values being counted as empty cells or dividing by zero errors if range is empty.',
    commonMistakesUrdu: 'Dono zeroes aur khali cells ko ek jesa samajhna (khali cells ko Average chor deta hai, zero ko shamil karta hai).',
    formulaTemplate: '=AVERAGE(StartCell:EndCell)',
    practiceQuestionEnglish: 'Write an AVERAGE formula to find the average marks of the students.',
    practiceQuestionUrdu: 'Students ke marks ka average nikalne ke liye AVERAGE formula likhein.',
    practiceData: [
      { 'Student': 'Zahid', 'Marks': 85 },
      { 'Student': 'Kiran', 'Marks': 90 },
      { 'Student': 'Fahad', 'Marks': 65 },
      { 'Student': 'Saira', 'Marks': 80 }
    ],
    practiceExpectedAnswer: '80',
    practiceValidationExpression: 'AVERAGE'
  },
  {
    id: 'countif',
    name: 'COUNTIF (شرط کے ساتھ گننا)',
    category: 'Conditional',
    whatItDoesEnglish: 'Counts the number of cells in a range that meet a specific condition or criteria.',
    whatItDoesUrdu: 'Kisi range me sirf un cells ko count karta hai jo aapki di hui condition par poora utrein.',
    dataStructureEnglish: 'A column of categorical or numerical values (e.g. status "Passed" or scores > 50).',
    dataStructureUrdu: 'Columns jisme text/categories ya status hon (jaise "Paid", "Pending" ya numbers).',
    commonMistakesEnglish: 'Forgetting quotation marks around text criteria or operators (e.g., using COUNTIF(A:A, >50) instead of COUNTIF(A:A, ">50")).',
    commonMistakesUrdu: 'Criteria ke sath double quotes (") lagana bhool jana, maslan >50 likhna bajaye ">50" ke.',
    formulaTemplate: '=COUNTIF(Range, Criteria)',
    practiceQuestionEnglish: 'Write a COUNTIF formula to find how many employees are "Active".',
    practiceQuestionUrdu: 'Active employees ko count karne ke liye COUNTIF ka sahi formula likhein.',
    practiceData: [
      { 'Name': 'Zahid', 'Status': 'Active' },
      { 'Name': 'Kiran', 'Status': 'Inactive' },
      { 'Name': 'Fahad', 'Status': 'Active' },
      { 'Name': 'Saira', 'Status': 'Active' },
      { 'Name': 'Amir', 'Status': 'Inactive' }
    ],
    practiceExpectedAnswer: '3',
    practiceValidationExpression: 'COUNTIF'
  },
  {
    id: 'vlookup',
    name: 'VLOOKUP (تفصیلات تلاش کرنا)',
    category: 'Lookup',
    whatItDoesEnglish: 'Looks for a value in the leftmost column of a table, and returns a value in the same row from another column.',
    whatItDoesUrdu: 'Table ke pehle column me koi value dhoond kar, uske samne wali row me se kisi doosre column ki value nikal ke lata hai.',
    dataStructureEnglish: 'A reference list/table where the lookup key resides in the very first column.',
    dataStructureUrdu: 'Aisa database/table jisme pehla column unique ID ya Code ho jis se data search karna ho.',
    commonMistakesEnglish: 'Using "TRUE" instead of "FALSE" for exact matches (results in wrong lookups), or using an index column larger than the table width.',
    commonMistakesUrdu: 'Exact match dhoondne ke liye aakhri argument "FALSE" ya "0" na likhna, jis se ghalat result aata hai.',
    formulaTemplate: '=VLOOKUP(LookupValue, TableArray, ColIndexNum, [RangeLookup])',
    practiceQuestionEnglish: 'Write a VLOOKUP formula to find "Sana"\'s salary. Table starts from G2 to H5. The lookup value is "Sana". ColIndex is 2.',
    practiceQuestionUrdu: '"Sana" ki basic salary dhoondne ke liye exact VLOOKUP formula likhein (Table Range: G2:H5, Column: 2).',
    practiceData: [
      { 'Employee': 'Ahmad', 'Salary': 150000 },
      { 'Employee': 'Sana', 'Salary': 120000 },
      { 'Employee': 'Ali', 'Salary': 50000 }
    ],
    practiceExpectedAnswer: '120000',
    practiceValidationExpression: 'VLOOKUP'
  },
  {
    id: 'pmt',
    name: 'PMT (قسط معلوم کرنا)',
    category: 'Finance',
    whatItDoesEnglish: 'Calculates the monthly payment for a loan based on constant payments and a constant interest rate.',
    whatItDoesUrdu: 'Kisi loan (karz) par har mahine di jane wali installment (qist) calculate karta hai interest rate ke mutabiq.',
    dataStructureEnglish: 'Requires interest rate, number of periods (months/years), and the loan principal amount.',
    dataStructureUrdu: 'Interest rate (sharah sood), total months/years, aur loan ki total raqam (principal) chahiye hoti hai.',
    commonMistakesEnglish: 'Not dividing the annual interest rate by 12 for monthly payments, or not multiplying years by 12 to get monthly periods.',
    commonMistakesUrdu: 'Salana interest rate ko 12 se divide na karna jab monthly payments nikalni hon.',
    formulaTemplate: '=PMT(AnnualRate/12, TotalMonths, -LoanAmount)',
    practiceQuestionEnglish: 'Write PMT to find monthly payment for a loan of 500,000 at 12% annual interest rate for 24 months (2 years).',
    practiceQuestionUrdu: '500,000 ke loan par 12% salana interest ke sath 24 mahino ki monthly qist nikalne ka PMT formula likhen.',
    practiceData: [
      { 'Detail': 'Loan Amount', 'Value': 500000 },
      { 'Detail': 'Annual Interest Rate', 'Value': '12%' },
      { 'Detail': 'Months', 'Value': 24 }
    ],
    practiceExpectedAnswer: '23536.74', // PMT(0.12/12, 24, -500000) = 23536.74
    practiceValidationExpression: 'PMT'
  }
];
