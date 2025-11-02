import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseCSV, parseExcel, parsePDF, ParsedTransaction } from '@/lib/statementParser';
import { supabase } from '@/integrations/supabase/client';
import { TransactionPreview } from './TransactionPreview';

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'categorizing' | 'preview' | 'success' | 'error';

interface CategorizedTransaction extends ParsedTransaction {
  category: string;
  confidence: number;
}

export function BankStatementUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV, Excel, or PDF file.',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setStatus('parsing');
      setError('');

      // Parse the file
      let parsedTransactions: ParsedTransaction[] = [];
      
      try {
        if (file.type === 'text/csv') {
          parsedTransactions = await parseCSV(file);
        } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
          parsedTransactions = await parseExcel(file);
        } else if (file.type === 'application/pdf') {
          parsedTransactions = await parsePDF(file);
        }
      } catch (parseError) {
        console.error('Parsing error:', parseError);
        throw new Error(
          parseError instanceof Error 
            ? parseError.message 
            : 'Failed to parse file. Please ensure it is a valid bank statement in CSV, Excel, or PDF format.'
        );
      }

      if (parsedTransactions.length === 0) {
        throw new Error('No transactions found in the file. Please check the format or try a different file type (CSV/Excel recommended for best results).');
      }

      toast({
        title: 'File Parsed',
        description: `Found ${parsedTransactions.length} transactions. Categorizing with AI...`
      });

      // Categorize with AI
      setStatus('categorizing');
      
      const { data, error: functionError } = await supabase.functions.invoke('categorize-transactions', {
        body: { transactions: parsedTransactions }
      });

      if (functionError) throw functionError;

      if (data.error) {
        throw new Error(data.error);
      }

      // Combine parsed transactions with AI categorizations
      const categorized: CategorizedTransaction[] = parsedTransactions.map((t, i) => ({
        ...t,
        category: data.categorizations[i]?.category || 'Other',
        confidence: data.categorizations[i]?.confidence || 0.5
      }));

      setTransactions(categorized);
      setStatus('preview');

      toast({
        title: 'Categorization Complete',
        description: 'Review and approve the transactions below.'
      });

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setStatus('error');
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Failed to process file',
        variant: 'destructive'
      });
    }
  };

  const handleApprove = () => {
    setStatus('success');
    toast({
      title: 'Success',
      description: `${transactions.length} transactions imported successfully!`
    });
    
    // Reset after showing preview
    setTimeout(() => {
      setStatus('idle');
      setFile(null);
      setTransactions([]);
    }, 2000);
  };

  const handleCancel = () => {
    setStatus('idle');
    setFile(null);
    setTransactions([]);
    setError('');
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'uploading':
        return { icon: Loader2, text: 'Uploading file...', color: 'text-primary' };
      case 'parsing':
        return { icon: Loader2, text: 'Extracting transactions...', color: 'text-primary' };
      case 'categorizing':
        return { icon: Loader2, text: 'AI categorizing transactions...', color: 'text-primary' };
      case 'success':
        return { icon: CheckCircle2, text: 'Import successful!', color: 'text-success' };
      case 'error':
        return { icon: AlertCircle, text: error, color: 'text-destructive' };
      default:
        return null;
    }
  };

  if (status === 'preview') {
    return (
      <TransactionPreview
        transactions={transactions}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onUpdate={setTransactions}
      />
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="glass-card p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Upload Bank Statement</h3>
            <p className="text-sm text-muted-foreground">
              Import transactions from CSV, Excel, or PDF files
            </p>
          </div>
        </div>

        {statusDisplay && (
          <div className={`flex items-center gap-2 p-3 rounded-lg bg-card ${statusDisplay.color}`}>
            <statusDisplay.icon className={`h-5 w-5 ${status === 'uploading' || status === 'parsing' || status === 'categorizing' ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{statusDisplay.text}</span>
          </div>
        )}

        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="statement-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileSelect}
            disabled={status !== 'idle' && status !== 'error'}
          />
          <label htmlFor="statement-upload" className="cursor-pointer">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-1">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-muted-foreground">
              CSV, Excel, or PDF (Max 10MB)
            </p>
          </label>
        </div>

        {file && status === 'idle' && (
          <div className="flex gap-2">
            <Button onClick={handleUpload} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Process File
            </Button>
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
