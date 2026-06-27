import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashing on start if the key is missing
let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set. AI Features will be offline.');
    }
    ai = new GoogleGenAI({
      apiKey: apiKey || 'PLACEHOLDER_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// API endpoint for formula suggestion and automated execution math code
app.post('/api/analyze-query', async (req, res) => {
  try {
    const { query, columns, sampleData, selectedTemplate } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a descriptive response when the key is missing, so user is guided to insert it
      res.json({
        formula: '=AVERAGE(C2:C50)',
        formulaType: 'aggregate',
        targetColumnName: 'Calculated Result (Demo)',
        explanationUrdu: 'Mazaqrat! API Key missing hai. Please Secrets panel mein apna GEMINI_API_KEY set karein. Tab tak ye demo formula dikhaya ja raha hai.',
        explanationEnglish: 'API Key is missing. Please set your GEMINI_API_KEY in the Secrets panel. Showing this demo result in the meantime.',
        jsFormulaEvalCode: '',
        aggregateEvalCode: '(() => { const col = columns[0] || ""; return rows.reduce((s, r) => s + (Number(r[col]) || 0), 0) / (rows.length || 1); })()',
        errorHandlingSuggested: 'No API Key set. Enter GEMINI_API_KEY to unlock smart AI detection.'
      });
      return;
    }

    const client = getGeminiClient();

    const promptText = `
User Query: "${query}"
Selected Template Context (if any): ${selectedTemplate || 'None'}
Excel Headers/Columns Available: ${JSON.stringify(columns)}
Sample Rows of Data: ${JSON.stringify(sampleData)}
`;

    const systemInstruction = `
You are an expert financial analyst, Excel spreadsheet guru, and formula assistant.
Your goal is to help users solve Excel problems, specifically focused on users who have little to no knowledge of Excel formulas.
The user might query in English, Urdu, or Roman Urdu (Urdu written in English alphabets like "Mujhe sales ka average nikalna hai" or "overtime calculate karo").

You will receive:
1. User's query (e.g. "total sales ka average", "overtime nikal do", "monthly profit", "Basic Salary and Allowance add karo")
2. Available columns in their Excel sheet
3. Sample rows of data

Your tasks:
1. Understand the user's intent. Identify what financial, mathematical, lookup, or date formula they need.
2. Formulate the exact Excel formula (e.g. "=SUM(C2:C10)", "=C2-D2-E2", "=XLOOKUP(A2, Sheet2!A:A, Sheet2!B:B)").
   - If they want a calculation for each row (row-by-row), specify 'row-by-row' and provide the formula template for row 2 (e.g. "=D2-E2" or "=D2*E2").
   - If they want an aggregate calculation (e.g. average, sum of a column), specify 'aggregate' and provide the column-wide formula (e.g. "=SUM(D2:D50)").
3. Explain how the formula works in friendly, clear Roman Urdu (Urdu written in English characters) so that Pakistanis and general Urdu speakers can easily understand. Example: "Hum ne SUM formula use kiya hai jo C2 se C10 tak tamam values ko jama karega."
4. Explain how the formula works in plain English.
5. Provide a safe JavaScript/TypeScript expression in 'jsFormulaEvalCode' (ONLY if formulaType is 'row-by-row') that can evaluate the result on the frontend for each row. The row can be accessed as a JS object named "row" where keys are the column names. E.g. "Number(row['Basic Salary'] || 0) + Number(row['Allowance'] || 0)" or "Number(row['Revenue'] || 0) - Number(row['Cost of Goods Sold'] || 0)". Ensure the keys match the exact input columns!
6. Provide a safe JavaScript/TypeScript expression in 'aggregateEvalCode' (ONLY if formulaType is 'aggregate') that can evaluate the result on the frontend for the whole dataset. It has access to an array of objects called "rows". E.g. "rows.reduce((sum, r) => sum + (Number(r['Amount']) || 0), 0)" or "(() => { const sum = rows.reduce((s, r) => s + (Number(r['Salary']) || 0), 0); return sum / (rows.length || 1); })()". Ensure the keys match exactly!
7. Suggest a good column name or label for the result under 'targetColumnName' (e.g. "Net Salary", "Total Average", "Gross Profit").
8. Suggest error handling details under 'errorHandlingSuggested' (e.g., using IFERROR to handle #DIV/0! or #N/A).

Always return a valid JSON object matching the requested schema.
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formula: {
              type: Type.STRING,
              description: "The calculated Excel formula string starting with '=', e.g. '=C2-D2' or '=AVERAGE(E:E)'."
            },
            formulaType: {
              type: Type.STRING,
              description: "Must be either 'row-by-row' or 'aggregate'."
            },
            targetColumnName: {
              type: Type.STRING,
              description: "The suggested column name or result label."
            },
            explanationUrdu: {
              type: Type.STRING,
              description: "Clear friendly explanation in Roman Urdu (Urdu in English alphabets) explaining why this formula is used."
            },
            explanationEnglish: {
              type: Type.STRING,
              description: "Clear explanation in English explaining why this formula is used."
            },
            jsFormulaEvalCode: {
              type: Type.STRING,
              description: "A single-line safe JavaScript expression to execute row-by-row. It has access to 'row' object. E.g. 'Number(row[\"Purchases\"] || 0) - Number(row[\"Sales\"] || 0)'. Keep it empty if formulaType is 'aggregate'."
            },
            aggregateEvalCode: {
              type: Type.STRING,
              description: "A multi-line or single-line JavaScript expression returning a single value. It has access to 'rows' array of row objects. E.g. 'rows.reduce((sum, r) => sum + (Number(r[\"Amount\"]) || 0), 0)'. Keep it empty if formulaType is 'row-by-row'."
            },
            errorHandlingSuggested: {
              type: Type.STRING,
              description: "Suggestions on handling #DIV/0! or #N/A errors using IFERROR or similar."
            }
          },
          required: [
            'formula',
            'formulaType',
            'targetColumnName',
            'explanationUrdu',
            'explanationEnglish',
            'jsFormulaEvalCode',
            'aggregateEvalCode',
            'errorHandlingSuggested'
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini returned empty response.');
    }

    const parsedResponse = JSON.parse(resultText.trim());
    res.json(parsedResponse);
  } catch (error: any) {
    console.error('Error analyzing query:', error);
    res.status(500).json({ error: error.message || 'Server error occurred during AI analysis.' });
  }
});

// Setup Vite Dev server middleware or static directory serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
