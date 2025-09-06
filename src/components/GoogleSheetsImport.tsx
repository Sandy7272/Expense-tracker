import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGoogleSheetsSync } from '@/hooks/useGoogleSheetsSync';
import { useSettings } from '@/hooks/useSettings';
import { 
  Database, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface ImportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewData?: any;
}

function ImportPreview({ isOpen, onClose, onConfirm, previewData }: ImportPreviewProps) {
  if (!isOpen) return null;

  return (
    <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <CardContent className="bg-background max-w-2xl w-full mx-4 p-6 rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Import Preview</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {previewData?.total || 0} transactions in your Google Sheet
            </p>
            <div className="flex gap-4">
              <Badge variant="outline" className="text-green-600">
                {previewData?.new || 0} New
              </Badge>
              <Badge variant="outline" className="text-orange-600">
                {previewData?.duplicates || 0} Duplicates (will be skipped)
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-2">Preview of new transactions:</h4>
            {previewData?.transactions?.slice(0, 5).map((tx: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-sm text-muted-foreground">{tx.category} • {tx.date}</div>
                </div>
                <Badge variant={tx.type === 'income' ? 'default' : 'secondary'}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                </Badge>
              </div>
            ))}
            {previewData?.transactions?.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                And {previewData.transactions.length - 5} more...
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              Import {previewData?.new || 0} Transactions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoogleSheetsImport() {
  const { settings, updateSettings } = useSettings();
  const { 
    authenticate, 
    syncData, 
    testConnection, 
    isAuthenticating, 
    isSyncing,
    isTesting 
  } = useGoogleSheetsSync();
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleSync = () => {
    if (settings?.sheet_url) {
      syncData.mutate(settings.sheet_url);
    }
  };

  const handleTestConnection = () => {
    if (settings?.sheet_url) {
      testConnection.mutate(settings.sheet_url);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSettings.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Google Sheets Import
          </CardTitle>
          <CardDescription>
            Automatically import and merge your transaction data from Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connection Status</h4>
                <p className="text-sm text-muted-foreground">
                  {settings?.google_auth_status === 'connected'
                    ? 'Connected to your Google account' 
                    : 'Connect to start importing data'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {settings?.google_auth_status === 'connected' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Not Connected
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {settings?.google_auth_status !== 'connected' && (
              <Button
                onClick={() => authenticate.mutate()}
                disabled={authenticate.isPending || isAuthenticating}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {authenticate.isPending || isAuthenticating ? 'Connecting...' : 'Connect Google Account'}
              </Button>
            )}
          </div>

          {settings?.google_auth_status === 'connected' && (
            <>
              <Separator />

              {/* Sheet Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Sheet Configuration</h4>
                
                <div className="space-y-2">
                  <Label>Google Sheets URL</Label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={settings?.sheet_url || ''}
                    onChange={(e) => handleSettingChange('sheet_url', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required columns: Date, Type (income/expense), Category, Description, Amount, Person (optional)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!settings?.sheet_url || isTesting}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  <Button
                    onClick={handleSync}
                    disabled={!settings?.sheet_url || isSyncing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isSyncing ? 'Importing...' : 'Import Now'}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Import History */}
              <div className="space-y-4">
                <h4 className="font-medium">Import Status</h4>
                
                {settings?.last_synced ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Last import: {new Date(settings.last_synced).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>No imports yet</span>
                  </div>
                )}

                {settings?.sync_errors && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Last error: {settings.sync_errors}</span>
                  </div>
                )}
              </div>

              {/* Progress Display */}
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing transactions...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Analyzing data and detecting duplicates...
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ImportPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={() => {
          setShowPreview(false);
          handleSync();
        }}
        previewData={previewData}
      />
    </div>
  );
}