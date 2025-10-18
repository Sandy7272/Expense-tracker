import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const sanitizeCell = (cell: string): string => {
 if (!cell) return '';
 let sanitized = cell.trim();

 // Prevent formula injection in spreadsheets
 if (['=', '+', '-', '@', '\t', '\r'].includes(sanitized.charAt(0))) {
   sanitized = `'` + sanitized;
 }

 // Basic XSS prevention by stripping HTML-like tags
 sanitized = sanitized.replace(/<[^>]*>?/gm, '');

 return sanitized;
};

interface CsvRow {
 [key: string]: string;
}

interface MappedTransaction {
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  person?: string;
}

interface ColumnMapping {
  date: string;
  type: string;
  category: string;
  description: string;
  amount: string;
  person: string;
}

interface CsvImporterProps {
  onImport: (transactions: MappedTransaction[]) => Promise<void>;
  onClose: () => void;
}

export function CsvImporter({ onImport, onClose }: CsvImporterProps) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    type: '',
    category: '',
    description: '',
    amount: '',
    person: ''
  });
  const [previewData, setPreviewData] = useState<MappedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');

  const parseCSV = useCallback((text: string): { headers: string[], data: CsvRow[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least 2 rows (headers + data)');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => sanitizeCell(v.replace(/"/g, '')));
      const row: CsvRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return { headers, data };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB`,
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('text/csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const text = await file.text();
      setProgress(30);
      
      const { headers, data } = parseCSV(text);
      setProgress(60);
      
      setCsvData(data);
      setHeaders(headers);
      
      // Auto-detect column mappings
      const autoMapping: ColumnMapping = {
        date: headers.find(h => /date/i.test(h)) || '',
        type: headers.find(h => /type|debit|credit/i.test(h)) || 'auto-detect',
        category: headers.find(h => /category|tag/i.test(h)) || '',
        description: headers.find(h => /description|memo|details|note/i.test(h)) || '',
        amount: headers.find(h => /amount|value|total|sum/i.test(h)) || '',
        person: headers.find(h => /person|name|payee/i.test(h)) || 'none'
      };
      
      setMapping(autoMapping);
      setProgress(100);
      setCurrentStep('mapping');
      
      toast({
        title: "File Uploaded Successfully",
        description: `Found ${data.length} rows with ${headers.length} columns`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [parseCSV, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const generatePreview = useCallback(() => {
    if (!csvData.length || !mapping.date || !mapping.amount) {
      toast({
        title: "Incomplete Mapping",
        description: "Please map at least Date and Amount columns",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      const mapped: MappedTransaction[] = csvData.map(row => {
        // Parse date
        let date = row[mapping.date];
        try {
          const parsedDate = new Date(date);
          date = parsedDate.toISOString().split('T')[0];
        } catch {
          date = new Date().toISOString().split('T')[0];
        }

        // Parse amount
        let amount = parseFloat(row[mapping.amount].replace(/[^-0-9.]/g, '')) || 0;
        
        // Determine type
        let type: 'income' | 'expense' = 'expense';
        if (mapping.type && mapping.type !== '' && row[mapping.type]) {
          const typeValue = row[mapping.type].toLowerCase();
          if (typeValue.includes('income') || typeValue.includes('credit') || amount > 0) {
            type = 'income';
          }
        } else {
          // Auto-detect from amount sign
          type = amount > 0 ? 'income' : 'expense';
        }

        amount = Math.abs(amount);

        return {
          date,
          type,
          category: row[mapping.category] || 'Other',
          description: row[mapping.description] || 'Imported transaction',
          amount,
          person: mapping.person && mapping.person !== '' ? row[mapping.person] : undefined
        };
      }).filter(tx => tx.amount > 0);

      setProgress(100);
      setPreviewData(mapped);
      setCurrentStep('preview');
      
      toast({
        title: "Preview Generated",
        description: `${mapped.length} valid transactions ready for import`,
      });
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to generate preview",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [csvData, mapping, toast]);

  const handleImport = useCallback(async () => {
    setCurrentStep('importing');
    setIsProcessing(true);
    setProgress(0);

    try {
      await onImport(previewData);
      setProgress(100);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${previewData.length} transactions`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import transactions",
        variant: "destructive",
      });
      setCurrentStep('preview');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [previewData, onImport, onClose, toast]);

  const resetImporter = () => {
    setCsvData([]);
    setHeaders([]);
    setMapping({
      date: '',
      type: '',
      category: '',
      description: '',
      amount: '',
      person: ''
    });
    setPreviewData([]);
    setCurrentStep('upload');
    setProgress(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-primary' : 'text-green-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'upload' ? 'border-primary bg-primary/10' : 'border-green-500 bg-green-500/10'}`}>
              {['mapping', 'preview', 'importing'].includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="font-medium">Upload</span>
          </div>
          <div className={`w-8 h-0.5 ${['mapping', 'preview', 'importing'].includes(currentStep) ? 'bg-green-500' : 'bg-muted'}`} />
          <div className={`flex items-center space-x-2 ${currentStep === 'mapping' ? 'text-primary' : ['preview', 'importing'].includes(currentStep) ? 'text-green-500' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'mapping' ? 'border-primary bg-primary/10' : ['preview', 'importing'].includes(currentStep) ? 'border-green-500 bg-green-500/10' : 'border-muted'}`}>
              {['preview', 'importing'].includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <span className="font-medium">Mapping</span>
          </div>
          <div className={`w-8 h-0.5 ${['preview', 'importing'].includes(currentStep) ? 'bg-green-500' : 'bg-muted'}`} />
          <div className={`flex items-center space-x-2 ${['preview', 'importing'].includes(currentStep) ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['preview', 'importing'].includes(currentStep) ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              3
            </div>
            <span className="font-medium">Import</span>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file containing your transaction data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <Input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <Button variant="outline">Choose File</Button>
            </div>
            
            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">Processing file...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {currentStep === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>
              Map your CSV columns to transaction fields. Found {csvData.length} rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-mapping">Date Column *</Label>
                <Select value={mapping.date} onValueChange={(value) => setMapping(prev => ({ ...prev, date: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount-mapping">Amount Column *</Label>
                <Select value={mapping.amount} onValueChange={(value) => setMapping(prev => ({ ...prev, amount: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type-mapping">Type Column</Label>
                <Select value={mapping.type || 'auto-detect'} onValueChange={(value) => setMapping(prev => ({ ...prev, type: value === 'auto-detect' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-detect">Auto-detect from amount</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-mapping">Category Column</Label>
                <Select value={mapping.category} onValueChange={(value) => setMapping(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description-mapping">Description Column</Label>
                <Select value={mapping.description} onValueChange={(value) => setMapping(prev => ({ ...prev, description: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select description column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="person-mapping">Person Column</Label>
                <Select value={mapping.person || 'none'} onValueChange={(value) => setMapping(prev => ({ ...prev, person: value === 'none' ? '' : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={resetImporter} variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button onClick={generatePreview} disabled={!mapping.date || !mapping.amount || isProcessing}>
                Generate Preview
              </Button>
            </div>

            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">Generating preview...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {currentStep === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review {previewData.length} transactions before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {previewData.slice(0, 10).map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={tx.type === 'income' ? 'bg-income text-income-foreground' : 'bg-expense text-expense-foreground'}>
                      {tx.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">{tx.category} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    {tx.person && <p className="text-sm text-muted-foreground">{tx.person}</p>}
                  </div>
                </div>
              ))}
              {previewData.length > 10 && (
                <p className="text-center text-muted-foreground py-2">
                  ... and {previewData.length - 10} more transactions
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setCurrentStep('mapping')} variant="outline">
                Back to Mapping
              </Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? 'Importing...' : `Import ${previewData.length} Transactions`}
              </Button>
            </div>

            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">Importing transactions...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}