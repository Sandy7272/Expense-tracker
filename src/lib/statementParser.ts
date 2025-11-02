import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  confidence?: number;
}

export async function parseCSV(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = normalizeTransactions(results.data);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export async function parseExcel(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const transactions = normalizeTransactions(jsonData);
        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function parsePDF(file: File): Promise<ParsedTransaction[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    
    console.log('PDF parsed, extracting transactions from text...');
    const transactions = extractTransactionsFromText(data.text);
    
    if (transactions.length === 0) {
      throw new Error('No transactions found. PDF may not be a bank statement or format is unsupported.');
    }
    
    return transactions;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. Please try converting to CSV or Excel format.');
  }
}

function normalizeTransactions(data: any[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  for (const row of data) {
    try {
      // Try to find date field
      const dateField = findField(row, ['date', 'transaction_date', 'txn_date', 'Date', 'Transaction Date']);
      // Try to find description field
      const descField = findField(row, ['description', 'particulars', 'narration', 'details', 'Description', 'Particulars']);
      // Try to find amount fields
      const debitField = findField(row, ['debit', 'withdrawal', 'debit_amount', 'Debit', 'Withdrawal']);
      const creditField = findField(row, ['credit', 'deposit', 'credit_amount', 'Credit', 'Deposit']);
      const amountField = findField(row, ['amount', 'Amount']);

      if (!dateField || !descField) continue;

      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      // Determine amount and type
      if (debitField && parseFloat(debitField) > 0) {
        amount = parseFloat(debitField);
        type = 'expense';
      } else if (creditField && parseFloat(creditField) > 0) {
        amount = parseFloat(creditField);
        type = 'income';
      } else if (amountField) {
        amount = Math.abs(parseFloat(amountField));
        type = parseFloat(amountField) < 0 ? 'expense' : 'income';
      }

      if (amount > 0) {
        transactions.push({
          date: normalizeDate(dateField),
          description: String(descField).trim(),
          amount,
          type
        });
      }
    } catch (error) {
      console.warn('Failed to parse row:', row, error);
    }
  }

  return transactions;
}

function findField(row: any, possibleNames: string[]): any {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return null;
}

function normalizeDate(dateStr: string): string {
  try {
    // Try multiple date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Try DD/MM/YYYY or DD-MM-YYYY
    const parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return new Date().toISOString().split('T')[0]; // Fallback to today
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function extractTransactionsFromText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');
  
  // Multiple patterns for different bank formats
  const patterns = [
    // Pattern 1: DD/MM/YYYY Description Amount (Debit/Credit)
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*(Dr|Cr|Debit|Credit)?/i,
    // Pattern 2: Date Description Withdrawal Deposit
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+(?:Withdrawal|Debit)?\s*([\d,]+\.?\d*)?\s+(?:Deposit|Credit)?\s*([\d,]+\.?\d*)?/i,
    // Pattern 3: Compact format with amounts
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)/i
  ];
  
  for (const line of lines) {
    // Skip header lines
    if (line.match(/Date|Transaction|Particulars|Description|Balance|Opening|Closing/i)) {
      continue;
    }
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const date = match[1];
        const description = match[2]?.trim();
        
        // Handle different amount formats
        let amount = 0;
        let type: 'income' | 'expense' = 'expense';
        
        if (match[4] && !match[3]) {
          // Deposit/Credit column
          amount = parseFloat((match[4] || '0').replace(/,/g, ''));
          type = 'income';
        } else if (match[3]) {
          amount = parseFloat((match[3] || '0').replace(/,/g, ''));
          // Check if Cr/Credit indicator
          const indicator = match[4]?.toLowerCase();
          type = (indicator === 'cr' || indicator === 'credit') ? 'income' : 'expense';
        }
        
        if (amount > 0 && description && description.length > 3) {
          transactions.push({
            date: normalizeDate(date),
            description: description.substring(0, 200), // Limit description length
            amount,
            type,
            confidence: 0.6 // Medium confidence for PDF extraction
          });
          break; // Found match, try next line
        }
      }
    }
  }
  
  console.log(`Extracted ${transactions.length} transactions from PDF`);
  return transactions;
}
