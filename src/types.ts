export interface TemplateInfo {
  id: string;
  name: string;
  descriptionUrdu: string;
  descriptionEnglish: string;
  requiredColumns: string[];
  sampleData: Record<string, any>[];
}

export interface FormulaLearningModule {
  id: string;
  name: string;
  category: 'Basic' | 'Conditional' | 'Lookup' | 'Finance' | 'Date' | 'Business';
  whatItDoesUrdu: string;
  whatItDoesEnglish: string;
  dataStructureUrdu: string;
  dataStructureEnglish: string;
  commonMistakesUrdu: string;
  commonMistakesEnglish: string;
  formulaTemplate: string; // e.g., "=SUM(range)"
  practiceQuestionUrdu: string;
  practiceQuestionEnglish: string;
  practiceData: Record<string, any>[];
  practiceExpectedAnswer: string; // evaluated target or answer
  practiceValidationExpression: string; // js or value to validate user's formula
}

export interface AnalysisResponse {
  formula: string;
  formulaType: 'row-by-row' | 'aggregate';
  targetColumnName: string;
  explanationUrdu: string;
  explanationEnglish: string;
  jsFormulaEvalCode: string; // JavaScript expression to compute the row-by-row values
  aggregateEvalCode: string; // JavaScript expression for aggregate evaluation
  errorHandlingSuggested: string; // how to handle DIV/0 or N/A
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
}
