import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
  // PDF parsing is done server-side in the edge function
  // This function just prepares the file for upload
  throw new Error('PDF parsing is handled by the server. Please use the edge function directly.');
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

// Removed extractTransactionsFromText - now handled server-side
