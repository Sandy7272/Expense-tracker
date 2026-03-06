import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TransactionPreview } from './TransactionPreview';
import { Progress } from '@/components/ui/progress';

type UploadStatus = 'idle' | 'reading' | 'ai-processing' | 'preview' | 'success' | 'error';

interface AITransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  confidence: number;
}

export function BankStatementUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<AITransaction[]>([]);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
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

    // Also allow by extension for cases where MIME type detection fails
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['csv', 'xlsx', 'xls', 'pdf'];

    if (!allowedTypes.includes(selectedFile.type) && !allowedExts.includes(ext || '')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV, Excel, or PDF file.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const readExcelAsText = async (file: File): Promise<string> => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    // Convert to CSV text for AI to parse
    return XLSX.utils.sheet_to_csv(firstSheet);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setError('');
      setProgress(10);
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isPDF = file.type === 'application/pdf' || ext === 'pdf';
      const isExcel = file.type.includes('spreadsheet') || file.type.includes('excel') || ext === 'xlsx' || ext === 'xls';

      // Step 1: Read file
      setStatus('reading');
      setProgress(20);

      let requestBody: any;

      if (isPDF) {
        const base64File = await readFileAsBase64(file);
        requestBody = { mode: 'parse-pdf', pdfFile: base64File };
      } else {
        // CSV or Excel → read as text and send to AI
        let rawText: string;
        if (isExcel) {
          rawText = await readExcelAsText(file);
        } else {
          rawText = await readFileAsText(file);
        }
        requestBody = { mode: 'parse-csv-ai', rawText };
      }

      // Step 2: Send to AI for smart parsing + categorization
      setStatus('ai-processing');
      setProgress(40);

      const { data, error: functionError } = await supabase.functions.invoke('categorize-transactions', {
        body: requestBody
      });

      setProgress(80);

      if (functionError) throw new Error(functionError.message || 'AI processing failed');
      if (data?.error) throw new Error(data.error);

      const aiTransactions = data?.transactions || [];

      if (aiTransactions.length === 0) {
        throw new Error('No transactions found. Please check the file format and try again.');
      }

      setTransactions(aiTransactions);
      setStatus('preview');
      setProgress(100);

      toast({
        title: `✨ AI Found ${aiTransactions.length} Transactions`,
        description: 'Review the smart categorization and import when ready.'
      });

    } catch (err) {
      console.error('Upload error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setError(message);
      setStatus('error');
      setProgress(0);
      toast({
        title: 'Processing Failed',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleApprove = () => {
    setStatus('success');
    toast({
      title: '✅ Import Complete',
      description: `${transactions.length} transactions imported successfully!`
    });
    
    setTimeout(() => {
      setStatus('idle');
      setFile(null);
      setTransactions([]);
      setProgress(0);
    }, 2000);
  };

  const handleCancel = () => {
    setStatus('idle');
    setFile(null);
    setTransactions([]);
    setError('');
    setProgress(0);
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

  const isProcessing = status === 'reading' || status === 'ai-processing';

  return (
    <Card className="glass-card p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Smart Import with AI</h3>
            <p className="text-sm text-muted-foreground">
              AI auto-detects categories — Zomato → Food, Salary → Income, SIP → Investment
            </p>
          </div>
        </div>

        {/* AI Processing Status */}
        {isProcessing && (
          <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">
                {status === 'reading' ? 'Reading file...' : 'AI is analyzing & categorizing transactions...'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {status === 'ai-processing' && 'Detecting merchants, categorizing expenses, identifying income sources...'}
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Import successful!</span>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* File Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="statement-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileSelect}
            disabled={isProcessing}
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

        {file && (status === 'idle' || status === 'error') && (
          <div className="flex gap-2">
            <Button onClick={handleUpload} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Smart Import
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
