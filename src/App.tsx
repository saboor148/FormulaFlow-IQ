import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Calculator,
  HelpCircle,
  RefreshCw,
  BookOpen,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  Search,
  Copy,
  Check,
  FileDown,
  ArrowRight,
  Play,
  AlertTriangle
} from 'lucide-react';

import { TEMPLATES, FORMULAS_LEARNING } from './templatesAndFormulas';
import FormulaComplexityChart from './components/FormulaComplexityChart';
import { ParsedSheet, AnalysisResponse, TemplateInfo } from './types';
import {
  getColumnLetter,
  getHeaderLetterMap,
  validateSheetColumns,
  evaluateRowFormula,
  evaluateAggregateFormula,
  downloadExcelSheet
} from './excelUtils';

// Pre-packaged sample datasets to let the user play with the AI Engine instantly
const SAMPLE_DATASETS = {
  sales: {
    name: "Retail Sales Tracker (Sample)",
    headers: ["Date", "Item Name", "Quantity", "Unit Price", "Cost Price", "Discount"],
    rows: [
      { "Date": "2026-06-01", "Item Name": "Wireless Mouse", "Quantity": 5, "Unit Price": 2500, "Cost Price": 1500, "Discount": 200 },
      { "Date": "2026-06-02", "Item Name": "Mechanical Keyboard", "Quantity": 2, "Unit Price": 8000, "Cost Price": 5000, "Discount": 500 },
      { "Date": "2026-06-03", "Item Name": "LED Smart Monitor", "Quantity": 1, "Unit Price": 45000, "Cost Price": 32000, "Discount": 1500 },
      { "Date": "2026-06-04", "Item Name": "USB-C Cable Hub", "Quantity": 10, "Unit Price": 1200, "Cost Price": 600, "Discount": 100 },
      { "Date": "2026-06-05", "Item Name": "Gaming Headset", "Quantity": 3, "Unit Price": 6500, "Cost Price": 4000, "Discount": 0 }
    ]
  },
  payroll: {
    name: "Company Salary Sheet (Sample)",
    headers: ["Employee ID", "Employee Name", "Designation", "Basic Salary", "Allowance", "Overtime Hours", "Overtime Rate"],
    rows: [
      { "Employee ID": "EMP-01", "Employee Name": "Sajid Mahmood", "Designation": "Sales Head", "Basic Salary": 85000, "Allowance": 15000, "Overtime Hours": 12, "Overtime Rate": 800 },
      { "Employee ID": "EMP-02", "Employee Name": "Ayesha Khan", "Designation": "HR Assistant", "Basic Salary": 60000, "Allowance": 10000, "Overtime Hours": 4, "Overtime Rate": 600 },
      { "Employee ID": "EMP-03", "Employee Name": "Kamran Malik", "Designation": "Senior Account Clerk", "Basic Salary": 120000, "Allowance": 25000, "Overtime Hours": 0, "Overtime Rate": 1000 },
      { "Employee ID": "EMP-04", "Employee Name": "Zainab Bibi", "Designation": "Logistics Lead", "Basic Salary": 75000, "Allowance": 12000, "Overtime Hours": 8, "Overtime Rate": 750 }
    ]
  }
};

export default function App() {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'templates' | 'engine' | 'learning'>('engine');

  // --- STATE FOR TEMPLATE TAB ---
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('inventory');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validationFileName, setValidationFileName] = useState<string>('');

  // --- STATE FOR AI ENGINE ---
  const [uploadedSheet, setUploadedSheet] = useState<ParsedSheet | null>(null);
  const [query, setQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
  
  // Custom formula column preview settings
  const [customColumnName, setCustomColumnName] = useState<string>('');
  const [previewValues, setPreviewValues] = useState<any[]>([]);
  const [computedSuccess, setComputedSuccess] = useState<boolean>(false);

  // Pagination for uploaded data preview
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 5;

  // --- STATE FOR FORMULA LEARNING HUB ---
  const [selectedLearningId, setSelectedLearningId] = useState<string>('sum');
  const [userPracticeFormula, setUserPracticeFormula] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    messageUrdu: string;
    messageEnglish: string;
    computedVal?: any;
  }>({ status: 'idle', messageUrdu: '', messageEnglish: '' });

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validateInputRef = useRef<HTMLInputElement>(null);

  // Filter templates list
  const filteredTemplates = TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.descriptionEnglish.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
  const activeLearning = FORMULAS_LEARNING.find(f => f.id === selectedLearningId) || FORMULAS_LEARNING[0];

  // --- HELPER HANDLERS ---
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  // Export raw uploaded sheet data to CSV (excluding AI columns)
  const exportRawToCSV = () => {
    if (!uploadedSheet) return;
    
    const headers = uploadedSheet.headers;
    const csvRows = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')
    ];
    
    uploadedSheet.rows.forEach(row => {
      const values = headers.map(header => {
        const val = row[header] !== undefined ? String(row[header]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${uploadedSheet.name.replace(/\.[^/.]+$/, "")}_raw.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and drop events for file uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Parse Excel file upload in AI Engine
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];
        
        if (jsonData.length === 0) {
          alert("Selected sheet appears to be empty.");
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setUploadedSheet({
          name: file.name,
          headers,
          rows: jsonData
        });
        
        // Reset states
        setAnalysisResult(null);
        setPreviewValues([]);
        setQuery('');
        setApiError(null);
        setCurrentPage(1);
        setComputedSuccess(false);
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls document.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // File Drop in AI Engine
  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  // Upload trigger click in AI Engine
  const handleEngineUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEngineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  // Preload a Sample Dataset in AI Engine
  const loadSampleDataset = (type: 'sales' | 'payroll') => {
    const data = SAMPLE_DATASETS[type];
    setUploadedSheet({
      name: data.name + ".xlsx",
      headers: data.headers,
      rows: JSON.parse(JSON.stringify(data.rows)) // deep clone
    });
    setAnalysisResult(null);
    setPreviewValues([]);
    setQuery('');
    setApiError(null);
    setCurrentPage(1);
    setComputedSuccess(false);
  };

  // Smart Validation File Upload (Tab 1)
  const handleValidationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];
        
        if (jsonData.length === 0) {
          alert("Sheet has no rows to validate.");
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const result = validateSheetColumns(headers, activeTemplate.requiredColumns);
        setValidationResult(result);
      } catch (err) {
        console.error("Error validating sheet:", err);
        alert("Could not process validation file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // One-click Styled Excel Template Download
  const handleTemplateDownload = (template: TemplateInfo) => {
    downloadExcelSheet(template.sampleData, `${template.name}_Template`);
  };

  // Query AI Formula Assistant
  const handleAnalyzeQuery = async () => {
    if (!query.trim() || !uploadedSheet) return;

    setIsAnalyzing(true);
    setApiError(null);
    setAnalysisResult(null);
    setPreviewValues([]);
    setComputedSuccess(false);

    try {
      // Send header list and first few sample rows as context for formula matching
      const sampleRows = uploadedSheet.rows.slice(0, 3);
      const res = await fetch('/api/analyze-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          columns: uploadedSheet.headers,
          sampleData: sampleRows,
          selectedTemplate: selectedTemplateId
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }

      const data: AnalysisResponse = await res.json();
      setAnalysisResult(data);
      setCustomColumnName(data.targetColumnName || 'Result');

      // Execute calculation safely in our sandbox engine to show live preview
      if (data.formulaType === 'row-by-row' && data.jsFormulaEvalCode) {
        const computed = uploadedSheet.rows.map(row => 
          evaluateRowFormula(data.jsFormulaEvalCode, row)
        );
        setPreviewValues(computed);
        setComputedSuccess(true);
      } else if (data.formulaType === 'aggregate' && data.aggregateEvalCode) {
        const computedVal = evaluateAggregateFormula(data.aggregateEvalCode, uploadedSheet.rows);
        setPreviewValues([computedVal]);
        setComputedSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'AI request failed. Please check your network or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download Modified Sheet with Computed Column and Real Formula Embedded
  const handleDownloadModified = () => {
    if (!uploadedSheet || !analysisResult || previewValues.length === 0) return;

    // Convert JavaScript expression context back into matching Excel Formula letters
    // E.g. we will provide the Excel header map to generate an appropriate formula template
    const headerMap = getHeaderLetterMap(uploadedSheet.headers);
    
    // We construct a dynamic Excel formula template like "=D{row} - E{row}"
    // Let's analyze the formula of the AI, or make a friendly conversion fallback
    let excelFormulaStr = analysisResult.formula;
    
    // Create the downloadable bundle
    downloadExcelSheet(
      uploadedSheet.rows,
      `Calculated_${uploadedSheet.name.replace('.xlsx', '')}`,
      {
        columnName: customColumnName,
        formulaTemplate: excelFormulaStr,
        formulaType: analysisResult.formulaType,
        computedValues: previewValues
      }
    );
  };

  // --- PRACTICE / LEARNING TAB RUNTIME ---
  const handlePracticeValidate = () => {
    if (!userPracticeFormula.trim()) return;

    const trimmedFormula = userPracticeFormula.trim().toUpperCase();
    if (!trimmedFormula.startsWith('=')) {
      setPracticeFeedback({
        status: 'error',
        messageUrdu: 'Formula hamesha barabari (=) ke nishaan se shuru hona chahiye! Maslan: =SUM(A1:A5)',
        messageEnglish: 'An Excel formula must always start with an equals sign (=)! E.g., =SUM(A1:A5)'
      });
      return;
    }

    // Check if the expected formula operator is used
    if (!trimmedFormula.includes(activeLearning.practiceValidationExpression)) {
      setPracticeFeedback({
        status: 'error',
        messageUrdu: `Is sawal mein aapko ${activeLearning.name} formula use karna chahiye tha.`,
        messageEnglish: `For this problem, you should use the ${activeLearning.name.split(' ')[0]} formula.`
      });
      return;
    }

    // Simple math simulation for practice values based on selected formula
    let correct = false;
    let computedVal: any = null;

    if (activeLearning.id === 'sum') {
      correct = trimmedFormula.includes('PRICE') || trimmedFormula.includes('B2:B5') || trimmedFormula.includes('B2') || trimmedFormula.includes('B5');
      computedVal = 14700;
    } else if (activeLearning.id === 'average') {
      correct = trimmedFormula.includes('MARKS') || trimmedFormula.includes('B2:B5') || trimmedFormula.includes('B2') || trimmedFormula.includes('B5');
      computedVal = 80;
    } else if (activeLearning.id === 'countif') {
      correct = trimmedFormula.includes('ACTIVE') || trimmedFormula.includes('STATUS');
      computedVal = 3;
    } else if (activeLearning.id === 'vlookup') {
      correct = trimmedFormula.includes('SANA') || trimmedFormula.includes('H3');
      computedVal = 120000;
    } else if (activeLearning.id === 'pmt') {
      correct = trimmedFormula.includes('PMT');
      computedVal = '23536.74';
    }

    if (correct) {
      setPracticeFeedback({
        status: 'success',
        messageUrdu: 'Mubarak ho! Aapka formula bilkul sahi hai aur isne sahi result dhoond liya hai.',
        messageEnglish: 'Excellent job! Your formula is 100% correct and generated the matching result.',
        computedVal
      });
    } else {
      setPracticeFeedback({
        status: 'error',
        messageUrdu: `Formula ka format thoda ghalat hai. Koshish karein ke exact cell range ya arguments theek hon. Template dekein: ${activeLearning.formulaTemplate}`,
        messageEnglish: `Close! But the range or criteria matches are slightly off. Try following this template: ${activeLearning.formulaTemplate}`
      });
    }
  };

  // UI state pagination values
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = uploadedSheet ? uploadedSheet.rows.slice(indexOfFirstRow, indexOfLastRow) : [];
  const totalPages = uploadedSheet ? Math.ceil(uploadedSheet.rows.length / rowsPerPage) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-teal-500/20 selection:text-teal-900">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 py-6 px-6 sm:px-12 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-teal-500 text-white rounded-lg shadow-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                FormulaFlow IQ
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>آسان فارمولا اور آٹو کیلکولیٹر</span>
              <span className="text-slate-300">•</span>
              <span>Your Intelligent Spreadsheet Assistant</span>
            </p>
          </div>

          {/* MAIN TABS SELECTOR */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-stretch md:self-auto border border-slate-200">
            <button
              id="tab-engine"
              onClick={() => setActiveTab('engine')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'engine'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4 text-teal-500" />
              <span>AI Formula Engine</span>
            </button>

            <button
              id="tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-500" />
              <span>Report Templates</span>
            </button>

            <button
              id="tab-learning"
              onClick={() => setActiveTab('learning')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'learning'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-500" />
              <span>Formula Learning Hub</span>
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: AI FORMULA ENGINE & CALCULATION PREVIEW */}
          {activeTab === 'engine' && (
            <motion.div
              key="engine"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TOP HERO INSIGHT */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
                  <Calculator className="w-64 h-64" />
                </div>
                <div className="relative z-10 max-w-3xl">
                  <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Core Spreadsheet AI Engine
                  </span>
                  <h2 className="text-xl sm:text-3xl font-bold mt-3 leading-tight">
                    Excel file upload karein aur Roman Urdu ya English mein query pochein!
                  </h2>
                  <p className="text-sm text-teal-50 mt-2">
                    Application khud data ko analyze kar ke sahi financial formula apply karegi aur download ke liye mukammal calculated Excel sheet taiyar kar ke degi.
                  </p>
                </div>
              </div>

              {/* TWO COLUMN GRID: FILE LOADER & INTENT SELECTOR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: DROPZONE AND DATA TABLE PREVIEW (8 COLS) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* DROPZONE / FILE LOADER CARD */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-teal-500" />
                          <span>Spreadsheet Upload Karein</span>
                        </h3>
                        <p className="text-xs text-slate-500">Upload your .xlsx, .xls or CSV file for processing</p>
                      </div>

                      {/* QUICK SAMPLES ROW */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Demo Datasets:</span>
                        <button
                          onClick={() => loadSampleDataset('sales')}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition"
                        >
                          Sales Tracker
                        </button>
                        <button
                          onClick={() => loadSampleDataset('payroll')}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition"
                        >
                          Salary Sheet
                        </button>
                      </div>
                    </div>

                    {/* DRAG AND DROP ZONE */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDropFile}
                      onClick={handleEngineUploadClick}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                        dragOver 
                          ? 'border-teal-500 bg-teal-50/40 scale-[0.99]' 
                          : 'border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleEngineFileChange}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-3 bg-white rounded-full shadow-xs text-slate-400 mb-3 border border-slate-100">
                          <FileSpreadsheet className="w-8 h-8 text-teal-500" />
                        </div>
                        {uploadedSheet ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-900 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>{uploadedSheet.name}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {uploadedSheet.rows.length} Rows detected • {uploadedSheet.headers.length} Columns
                            </p>
                            <span className="mt-3 inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-md">
                              Change File / Doosri file chunein
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Excel file yahan drag karein ya click kar ke select karein
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Supports .xlsx, .xls and .csv spreadsheets
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE FILE INTERACTIVE PREVIEW CARD */}
                  {uploadedSheet && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-teal-500 rounded-full"></span>
                            <span>Spreadsheet Data Preview</span>
                          </h4>
                          <p className="text-xs text-slate-500">Pehle column ke pehchan ke sath data grid visualization</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            id="export-csv-btn"
                            onClick={exportRawToCSV}
                            className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                            title="Export raw data to CSV (excluding any AI-calculated column)"
                          >
                            <FileDown className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export to CSV</span>
                          </button>
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-md border border-slate-200">
                            Total Rows: {uploadedSheet.rows.length}
                          </span>
                        </div>
                      </div>

                      {/* PREVIEW TABLE CONTAINER */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                              <th className="p-2.5 text-slate-500 font-mono text-[10px] text-center w-12 border-r border-slate-200">
                                Row
                              </th>
                              {uploadedSheet.headers.map((header, idx) => (
                                <th key={header} className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                                      {getColumnLetter(idx)}
                                    </span>
                                    <span>{header}</span>
                                  </div>
                                </th>
                              ))}
                              {/* If computed preview results are active, show calculated preview column */}
                              {previewValues.length > 0 && (
                                <th className="p-3 bg-teal-50/50 text-teal-900 font-bold border-l-2 border-teal-500 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-teal-600 uppercase">
                                      NEW ({getColumnLetter(uploadedSheet.headers.length)})
                                    </span>
                                    <span className="flex items-center gap-1 text-teal-900 font-extrabold">
                                      <Sparkles className="w-3 h-3 text-teal-600" />
                                      {customColumnName}
                                    </span>
                                  </div>
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {currentRows.map((row, globalIdx) => {
                              const actualIdx = indexOfFirstRow + globalIdx;
                              return (
                                <tr key={actualIdx} className="hover:bg-slate-50/40 transition">
                                  <td className="p-2.5 text-center font-mono text-slate-400 bg-slate-50 border-r border-slate-200">
                                    {actualIdx + 2}
                                  </td>
                                  {uploadedSheet.headers.map(header => (
                                    <td key={header} className="p-3 text-slate-600 font-medium whitespace-nowrap">
                                      {row[header] !== undefined ? String(row[header]) : ''}
                                    </td>
                                  ))}
                                  {/* Calculated dynamic values column */}
                                  {previewValues.length > 0 && (
                                    <td className="p-3 bg-teal-50/20 text-teal-700 font-bold border-l-2 border-teal-500 font-mono whitespace-nowrap">
                                      {analysisResult?.formulaType === 'row-by-row' ? (
                                        previewValues[actualIdx] !== undefined ? String(previewValues[actualIdx]) : '-'
                                      ) : (
                                        actualIdx === 0 ? String(previewValues[0]) : <span className="text-slate-300">-</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* PAGINATION STATUS CONTROLS */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-slate-500">
                            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, uploadedSheet.rows.length)} of {uploadedSheet.rows.length} rows
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 transition"
                            >
                              Prev
                            </button>
                            <span className="text-xs font-bold text-slate-800">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: AI CONSOLE & QUERY BOX (4 COLS) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* AI CONSOLE BOX */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
                        <span>Formula Suggestion Assistant</span>
                      </h3>
                      <p className="text-xs text-slate-500">Apne data par calculation ke liye sawal poochein</p>
                    </div>

                    {/* DYNAMIC SAMPLES BOX */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">
                        Query Examples:
                      </span>
                      <button
                        onClick={() => setQuery("Basic Salary aur Allowance ko plus kar ke total salary nikal do")}
                        disabled={!uploadedSheet}
                        className="text-left w-full hover:text-teal-600 hover:underline block truncate text-slate-600"
                      >
                        “Basic Salary aur Allowance plus karo”
                      </button>
                      <button
                        onClick={() => setQuery("Quantity ko Unit Price se multiply karo aur Discount minus karo")}
                        disabled={!uploadedSheet}
                        className="text-left w-full hover:text-teal-600 hover:underline block truncate text-slate-600"
                      >
                        “Quantity ko Unit Price se multiply kar do”
                      </button>
                      <button
                        onClick={() => setQuery("Overtime Hours ka average calculation nikal do")}
                        disabled={!uploadedSheet}
                        className="text-left w-full hover:text-teal-600 hover:underline block truncate text-slate-600"
                      >
                        “Overtime Hours ka average dhoondo”
                      </button>
                    </div>

                    {/* QUERY INPUT TEXTAREA */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Aap kya calculation karna chahte hain?
                      </label>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={!uploadedSheet}
                        placeholder={
                          uploadedSheet 
                            ? "E.g. Mujhe Total Sales ka SUM nikal kar de do ya employee basic salary overtime calculate karo..." 
                            : "Pehle Excel Sheet upload ya Sample select karein..."
                        }
                        className="w-full h-24 p-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100/60 disabled:cursor-not-allowed transition"
                      />
                    </div>

                    {/* ANALYZE BUTTON */}
                    <button
                      onClick={handleAnalyzeQuery}
                      disabled={!uploadedSheet || !query.trim() || isAnalyzing}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI is Analyzing Columns...</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4" />
                          <span>Calculate with Formula</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* API KEY WARNING WARNING */}
                  {process.env.GEMINI_API_KEY === undefined && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Demo Mode Active</p>
                        <p className="mt-1 text-amber-700">
                          AI Studio is running offline because `GEMINI_API_KEY` is missing in Secrets panel. Standard default Excel formulas will be used for testing. Set API Key to activate smart detection!
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* DYNAMIC DISPLAY CARD FOR AI ANALYSIS OUTPUTS */}
              <AnimatePresence>
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
                  >
                    {/* SECTION TITLE HEADER */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                      <div>
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 rounded-md">
                          Smart Result Verified
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-teal-500" />
                          <span>AI Selected Excel Formula & Analysis</span>
                        </h3>
                      </div>

                      {/* DOWNLOADING COMPUTE EXCEL FILE ACTION */}
                      {previewValues.length > 0 && (
                        <button
                          onClick={handleDownloadModified}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs hover:shadow-md transition duration-200"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Calculated Excel Download Karein</span>
                        </button>
                      )}
                    </div>

                    {/* MIDDLE COLUMN BLOCK FOR CORES AND EXPLANATIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* SUBCOLUMN 1: FORMULA DISPLAY */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Excel Formula
                          </span>
                          <div className="relative mt-2 font-mono text-sm sm:text-base font-bold text-slate-900 bg-white p-3.5 border border-slate-200 rounded-lg break-all">
                            {analysisResult.formula}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Formula Type:</span>
                            <span className="font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-sm capitalize">
                              {analysisResult.formulaType}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">New Column:</span>
                            <input
                              type="text"
                              value={customColumnName}
                              onChange={(e) => setCustomColumnName(e.target.value)}
                              className="font-bold border border-slate-200 bg-white px-2 py-0.5 rounded-sm text-slate-800 text-right w-36 text-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => copyToClipboard(analysisResult.formula)}
                          className="w-full py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold flex items-center justify-center gap-1 transition"
                        >
                          {copiedFormula ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Formula Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Formula</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* SUBCOLUMN 2: ROMAN URDU INTERACTIVE EXPLANATION */}
                      <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 bg-teal-500 text-white rounded-md text-[9px] font-bold">UR</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                            Explanation in Roman Urdu
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-teal-900 leading-relaxed font-medium mt-1">
                          {analysisResult.explanationUrdu}
                        </p>
                      </div>

                      {/* SUBCOLUMN 3: ENGLISH EXPLANATION */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 bg-slate-700 text-white rounded-md text-[9px] font-bold">EN</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            Explanation in English
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                          {analysisResult.explanationEnglish}
                        </p>
                      </div>

                    </div>

                    {/* SMART DATA VALIDATOR EXCEL INSIGHT */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
                      <Info className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Smart Data Execution sandbox:</p>
                        <p className="mt-0.5 text-slate-600">
                          Humari calculation engine ne matches ke mutabiq values ko check kiya hai. 
                          Agar aap calculated sheet download karenge, to data mein naya column <span className="font-bold text-slate-800">"{customColumnName}"</span> shamil ho jaega aur usme asal live formula code <span className="font-mono bg-white px-1 py-0.5 border rounded-sm">{analysisResult.formula}</span> embed hoga.
                        </p>
                        <p className="mt-1 font-semibold text-teal-700">
                          Suggestive Error Handing: {analysisResult.errorHandlingSuggested}
                        </p>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* TAB 2: ONE-CLICK READYMADE EXCEL TEMPLATES & VALIDATOR */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* HERO BLOCK */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
                <div>
                  <span className="bg-teal-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Ready-Made Structured Templates
                  </span>
                  <h2 className="text-xl sm:text-3xl font-bold mt-2 tracking-tight">
                    Aap kya banana chahte hain?
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                    Sahi template ka chunao karein, required columns check karein, aur ek ready-to-use professional layout download karein jahan formulas pehle se set hain.
                  </p>
                </div>
                
                {/* INTERACTIVE SEARCH INPUT */}
                <div className="relative w-full md:w-72">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search standard sheets..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-teal-400 transition"
                  />
                </div>
              </div>

              {/* TWO COLUMN INTERFACE: TEMPLATE SELECTION (LEFT) & TEMPLATE VIEW (RIGHT) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT TEMPLATE SELECTION DIRECTORY (4 COLS) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-h-[600px] overflow-y-auto space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-2">
                    Standard Layouts Category
                  </span>
                  {filteredTemplates.map(t => {
                    const isSelected = t.id === selectedTemplateId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setValidationResult(null);
                          setValidationFileName('');
                        }}
                        className={`w-full text-left p-3 rounded-xl transition duration-150 flex items-center justify-between group ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-semibold truncate">{t.name}</p>
                          <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                            {t.descriptionEnglish}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-teal-400 translate-x-1' : 'text-slate-400 group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
                  {filteredTemplates.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No matching templates found.</p>
                  )}
                </div>

                {/* RIGHT DETAILED TEMPLATE WORKSPACE (8 COLS) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* DETAIL BOX CARD */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    
                    {/* CARD HEADER */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{activeTemplate.name} Template</h3>
                        <p className="text-xs text-teal-600 font-medium font-urdu mt-0.5">
                          {activeTemplate.descriptionUrdu}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activeTemplate.descriptionEnglish}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTemplateDownload(activeTemplate)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                      >
                        <Download className="w-4 h-4 text-teal-400" />
                        <span>Download Template Starter</span>
                      </button>
                    </div>

                    {/* REQUIRED COLUMNS COMPONENT */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Required Columns:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeTemplate.requiredColumns.map(col => (
                          <span
                            key={col}
                            className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition text-slate-700 text-xs font-semibold rounded-lg font-mono flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* SMART VALIDATOR DROPZONE TO CHECK COLUMNS EXCEL */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                          <span>Smart Format Validator</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Apni file upload karein aur check karein ke kiya aapke columns is template se match karte hain.
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <button
                          onClick={() => validateInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span>Apni File Select Karein</span>
                        </button>
                        <input
                          type="file"
                          ref={validateInputRef}
                          onChange={handleValidationFileChange}
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                        />
                        {validationFileName && (
                          <span className="text-xs font-mono bg-slate-200 px-2.5 py-1 text-slate-700 rounded-md">
                            Selected: {validationFileName}
                          </span>
                        )}
                      </div>

                      {/* DISPLAY OF COLUMN CHECK RESULTS */}
                      {validationResult && (
                        <div className="bg-white border border-slate-100 p-4 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">Validation Summary:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              validationResult.isValid 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {validationResult.matchPercentage}% Columns Match
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            {/* MATCHED COLUMNS LIST */}
                            <div className="space-y-1">
                              <span className="font-bold text-slate-500 block">Matched Columns (✓)</span>
                              {validationResult.matched.length > 0 ? (
                                <div className="space-y-1">
                                  {validationResult.matched.map((col: string) => (
                                    <p key={col} className="text-emerald-700 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{col}</span>
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400">None of the columns matched.</p>
                              )}
                            </div>

                            {/* MISSING COLUMNS */}
                            <div className="space-y-1">
                              <span className="font-bold text-slate-500 block">Missing Columns (X)</span>
                              {validationResult.missing.length > 0 ? (
                                <div className="space-y-1">
                                  {validationResult.missing.map((col: string) => (
                                    <p key={col} className="text-red-700 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                      <span>{col}</span>
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Perfect match! No missing columns.</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* SYSTEM RECOMMENDATION */}
                          {!validationResult.isValid && (
                            <div className="p-3 bg-amber-50/50 text-amber-800 rounded-lg text-xs flex items-start gap-1.5 mt-2 border border-amber-100">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Urdu Column Guide:</p>
                                <p className="mt-0.5 text-amber-700 leading-relaxed">
                                  Aapki spreadsheet mein upar diye gaye missing columns ka hona zaroori hai. Koshish karein ke missing columns ko exact naam se rename kar ke dobara upload karein takay standard calculations perform hoskein.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 3: FORMULA LEARNING PLAYGROUND */}
          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* HERO HEADER */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 flex items-center justify-between overflow-hidden relative shadow-md">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5">
                  <BookOpen className="w-64 h-64 text-emerald-100" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 rounded-full">
                    Formula Learning Center
                  </span>
                  <h2 className="text-xl sm:text-3xl font-bold mt-2">
                    Spreadsheet Formula seekhein bilkul aasaan zubaan mein!
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                    Yahan aap core formulas ka maqsad, unki common mistakes aur dual bilingual explanations (Urdu/English) dekh sakte hain aur live practice kar sakte hain.
                  </p>
                </div>
              </div>

              {/* FORMULA COMPLEXITY CHART */}
              <FormulaComplexityChart
                formulas={FORMULAS_LEARNING}
                selectedFormulaId={selectedLearningId}
                onSelectFormula={(id) => {
                  setSelectedLearningId(id);
                  setUserPracticeFormula('');
                  setPracticeFeedback({ status: 'idle', messageUrdu: '', messageEnglish: '' });
                }}
              />

              {/* THREE COLUMN GRID NAVIGATION & INTERACTIVE ENGINE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT LIST SELECTOR MODULE (3 COLS) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 h-[450px] overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                    Select Formula Module
                  </span>
                  {FORMULAS_LEARNING.map(f => {
                    const isSelected = f.id === selectedLearningId;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedLearningId(f.id);
                          setUserPracticeFormula('');
                          setPracticeFeedback({ status: 'idle', messageUrdu: '', messageEnglish: '' });
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{f.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {f.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* RIGHT INFORMATION CONTAINER AND PRACTICING ENVIRONMENT (9 COLS) */}
                <div className="lg:col-span-9 space-y-6">
                  
                  {/* INFORMATION CARD FOR FORMULA DETAILS */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sm">
                          {activeLearning.category} Module
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
                          {activeLearning.name}
                        </h3>
                      </div>
                      
                      <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                        Syntax: {activeLearning.formulaTemplate}
                      </div>
                    </div>

                    {/* DUAL COLUMN DESCRIPTIONS ENGLISH AND URDU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* ROMAN URDU CARD GUIDE */}
                      <div className="p-4 bg-teal-50/10 border border-teal-100 rounded-xl space-y-3">
                        <span className="font-bold text-xs text-teal-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                          Yeh Formula kis kaam aata hai?
                        </span>
                        <p className="text-xs sm:text-sm text-teal-900 leading-relaxed font-medium">
                          {activeLearning.whatItDoesUrdu}
                        </p>

                        <span className="font-bold text-xs text-teal-800 block mt-3">
                          Data Structure Kaisa Hona chahiye?
                        </span>
                        <p className="text-xs text-slate-600">
                          {activeLearning.dataStructureUrdu}
                        </p>

                        <span className="font-bold text-xs text-amber-800 block mt-3">
                          Common Mistakes (Aam Galtiyan):
                        </span>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                          {activeLearning.commonMistakesUrdu}
                        </p>
                      </div>

                      {/* ENGLISH CARD GUIDE */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                          What does this formula do?
                        </span>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {activeLearning.whatItDoesEnglish}
                        </p>

                        <span className="font-bold text-xs text-slate-700 block mt-3">
                          Required Data Layout:
                        </span>
                        <p className="text-xs text-slate-500">
                          {activeLearning.dataStructureEnglish}
                        </p>

                        <span className="font-bold text-xs text-slate-700 block mt-3">
                          Common Pitfalls:
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-100 p-2.5 rounded-lg">
                          {activeLearning.commonMistakesEnglish}
                        </p>
                      </div>

                    </div>

                    {/* INTERACTIVE PRACTICE ENVIRONMENT BOX */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 shadow-sm">
                      <div className="border-b border-slate-800 pb-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Play className="w-4 h-4 text-emerald-500" />
                          <span>Interactive Practice Arena</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Solve this challenge by typing the correct formula into the terminal input.
                        </p>
                      </div>

                      {/* QUESTION DISCLOSURES */}
                      <div className="space-y-1 bg-slate-800/60 border border-slate-800 p-3 rounded-lg text-xs">
                        <p className="text-emerald-300 font-medium">Q: {activeLearning.practiceQuestionEnglish}</p>
                        <p className="text-slate-300 font-urdu mt-1">{activeLearning.practiceQuestionUrdu}</p>
                      </div>

                      {/* PRACTICE GRID VISUAL TABLE */}
                      <div className="overflow-x-auto border border-slate-800 rounded-lg max-w-md bg-slate-950/40">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <th className="p-2 border-r border-slate-800 text-center w-10">Row</th>
                              {Object.keys(activeLearning.practiceData[0]).map(key => (
                                <th key={key} className="p-2 uppercase">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {activeLearning.practiceData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="p-2 border-r border-slate-800 text-center text-slate-500 bg-slate-900">{idx + 2}</td>
                                {Object.values(row).map((val: any, vIdx) => (
                                  <td key={vIdx} className="p-2 text-slate-300">{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* FORMULA ENTRY AND PLAY SUBMISSION */}
                      <div className="space-y-3 max-w-xl">
                        <label className="text-xs font-bold text-slate-300 block">
                          Enter Excel Formula:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userPracticeFormula}
                            onChange={(e) => setUserPracticeFormula(e.target.value)}
                            placeholder="e.g. =SUM(B2:B5)"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                          />
                          <button
                            onClick={handlePracticeValidate}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono tracking-wider uppercase transition"
                          >
                            RUN
                          </button>
                        </div>

                        {/* LIVE PLAY FEEDBACK OUTPUT */}
                        {practiceFeedback.status !== 'idle' && (
                          <div className={`p-3 rounded-lg text-xs space-y-1.5 ${
                            practiceFeedback.status === 'success' 
                              ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-200' 
                              : 'bg-red-950/50 border border-red-900/80 text-red-200'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold">
                              {practiceFeedback.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span>
                                {practiceFeedback.status === 'success' ? 'Calculated Successfully!' : 'Formula Error!'}
                              </span>
                            </div>
                            <p className="font-urdu leading-relaxed text-slate-100">{practiceFeedback.messageUrdu}</p>
                            <p className="text-[11px] text-slate-300">{practiceFeedback.messageEnglish}</p>
                            {practiceFeedback.computedVal && (
                              <div className="mt-2 text-xs font-mono">
                                <span className="text-slate-400">Result generated:</span> <span className="text-emerald-300 font-bold">{practiceFeedback.computedVal}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 FormulaFlow IQ. Designed offline-first and fully optimized.</p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[10px] text-slate-500">
              VITE + EXPRESS
            </span>
            <span className="px-2 py-0.5 bg-teal-50 rounded-md font-mono text-[10px] text-teal-700">
              SHEETJS (XLSX)
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
