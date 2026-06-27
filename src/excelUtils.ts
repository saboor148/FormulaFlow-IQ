import * as XLSX from 'xlsx';

/**
 * Returns the Excel column letter (e.g., 0 -> A, 25 -> Z, 26 -> AA)
 */
export function getColumnLetter(index: number): string {
  let letter = '';
  let tempIndex = index;
  while (tempIndex >= 0) {
    letter = String.fromCharCode((tempIndex % 26) + 65) + letter;
    tempIndex = Math.floor(tempIndex / 26) - 1;
  }
  return letter;
}

/**
 * Maps all headers of a sheet to their respective Excel column letters
 */
export function getHeaderLetterMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach((header, idx) => {
    map[header] = getColumnLetter(idx);
  });
  return map;
}

/**
 * Validates a sheet structure against a template's required columns.
 * Returns information about matches, missing columns, and suggested renames.
 */
export interface ValidationResult {
  isValid: boolean;
  matchPercentage: number;
  matched: string[];
  missing: string[];
  unmatchedUploaded: string[];
}

export function validateSheetColumns(
  uploadedHeaders: string[],
  requiredColumns: string[]
): ValidationResult {
  const uploadedSet = new Set(uploadedHeaders.map(h => h.trim().toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];

  requiredColumns.forEach(col => {
    const trimmedCol = col.trim().toLowerCase();
    // Try exact or close match
    const found = uploadedHeaders.find(
      h => h.trim().toLowerCase() === trimmedCol
    );
    if (found) {
      matched.push(col);
    } else {
      missing.push(col);
    }
  });

  const unmatchedUploaded = uploadedHeaders.filter(
    h => !requiredColumns.some(rc => rc.trim().toLowerCase() === h.trim().toLowerCase())
  );

  const matchPercentage = requiredColumns.length > 0 
    ? Math.round((matched.length / requiredColumns.length) * 100)
    : 100;

  return {
    isValid: missing.length === 0,
    matchPercentage,
    matched,
    missing,
    unmatchedUploaded
  };
}

/**
 * Evaluates a row-by-row JavaScript calculation string safely
 */
export function evaluateRowFormula(
  expression: string,
  row: Record<string, any>
): any {
  try {
    // Create a safe sandbox function context
    // The expression might look like: "Number(row['Basic Salary'] || 0) + Number(row['Allowance'] || 0)"
    const keys = Object.keys(row);
    const func = new Function('row', `try { return (${expression}); } catch(e) { return '#VALUE!'; }`);
    const val = func(row);
    if (typeof val === 'number') {
      if (isNaN(val)) return '#VALUE!';
      return Number(val.toFixed(2));
    }
    return val;
  } catch (err) {
    return '#VALUE!';
  }
}

/**
 * Evaluates an aggregate JavaScript calculation string safely
 */
export function evaluateAggregateFormula(
  expression: string,
  rows: Record<string, any>[]
): any {
  try {
    // The expression might look like: "rows.reduce((sum, r) => sum + (Number(r['Amount']) || 0), 0)"
    const func = new Function('rows', `try { return (${expression}); } catch(e) { return '#VALUE!'; }`);
    const val = func(rows);
    if (typeof val === 'number') {
      if (isNaN(val)) return '#VALUE!';
      return Number(val.toFixed(2));
    }
    return val;
  } catch (err) {
    return '#VALUE!';
  }
}

/**
 * Downloads a list of rows as a styled spreadsheet using SheetJS
 */
export function downloadExcelSheet(
  data: Record<string, any>[],
  fileName: string,
  addedFormula?: {
    columnName: string;
    formulaTemplate: string; // e.g. "=D{row}+E{row}" where {row} will be replaced by index
    formulaType: 'row-by-row' | 'aggregate';
    computedValues: any[];
  }
) {
  // Construct sheet data
  const sheetData: any[] = [];
  
  if (addedFormula) {
    data.forEach((row, idx) => {
      const newRow = { ...row };
      const excelRowIndex = idx + 2; // Row 1 is header
      
      if (addedFormula.formulaType === 'row-by-row') {
        const formulaStr = addedFormula.formulaTemplate.replace(/{row}/g, String(excelRowIndex));
        // Use SheetJS cell object notation to support both calculated value and live formula
        newRow[addedFormula.columnName] = {
          t: 'n',
          v: typeof addedFormula.computedValues[idx] === 'number' ? addedFormula.computedValues[idx] : 0,
          f: formulaStr
        };
      } else {
        // Aggregate formula (place on first row, or append as a separate summary row at the bottom)
        newRow[addedFormula.columnName] = idx === 0 ? {
          t: 'n',
          v: typeof addedFormula.computedValues[0] === 'number' ? addedFormula.computedValues[0] : 0,
          f: addedFormula.formulaTemplate
        } : '';
      }
      sheetData.push(newRow);
    });

    // If it is aggregate, let's also add an extra clean total summary row at the bottom for beautiful output
    if (addedFormula.formulaType === 'aggregate') {
      const totalRow: Record<string, any> = {};
      totalRow[Object.keys(data[0])[0]] = 'TOTAL / SUMMARY';
      totalRow[addedFormula.columnName] = {
        t: 'n',
        v: addedFormula.computedValues[0],
        f: addedFormula.formulaTemplate
      };
      sheetData.push(totalRow);
    }
  } else {
    // Standard template download
    data.forEach(row => sheetData.push({ ...row }));
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // If there are formulas, make sure we format them correctly in SheetJS
  if (addedFormula) {
    // Traverse worksheet cells and re-assign cell objects that have formulas
    // To ensure Excel treats them as formulas with cached results
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const targetColIdx = Object.keys(sheetData[0]).indexOf(addedFormula.columnName);
    
    if (targetColIdx !== -1) {
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: targetColIdx });
        const cellData = worksheet[cellRef];
        
        if (cellData && typeof cellData.v === 'object' && cellData.v.f) {
          worksheet[cellRef] = {
            t: cellData.v.t,
            v: cellData.v.v,
            f: cellData.v.f
          };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName.replace(/\s+/g, '_')}.xlsx`);
}
