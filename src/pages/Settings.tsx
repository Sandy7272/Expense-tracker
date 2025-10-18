import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSettings } from "@/hooks/useSettings";
import { useGoogleSheetsSync } from "@/hooks/useGoogleSheetsSync";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  User,
  Database, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2
} from "lucide-react";

const SettingsSchema = z.object({
  sheet_url: z.string()
    .url({ message: "Please enter a valid URL." })
    .regex(new RegExp('^https://docs.google.com/spreadsheets/d/'), { message: "URL must be a valid Google Sheets link." }),
  auto_sync: z.boolean(),
  currency: z.string(),
  language: z.string(),
  theme: z.string(),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const {
    authenticate,
    syncData,
    testConnection,
    isAuthenticating,
    isSyncing,
    isTesting
  } = useGoogleSheetsSync();
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      sheet_url: '',
      auto_sync: false,
      currency: 'INR',
      language: 'en',
      theme: 'light',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        sheet_url: settings.sheet_url || '',
        auto_sync: settings.auto_sync || false,
        currency: settings.currency || 'INR',
        language: settings.language || 'en',
        theme: settings.theme || 'light',
      });
    }
  }, [settings, form]);

  const handleSettingChange = (key: keyof SettingsFormValues, value: any) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    handleSettingChange('theme', newTheme);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Sandy Kumar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="sandy@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" defaultValue="Personal Finance Enthusiast" />
            </div>
            <Button className="cyber-button">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Google Sheets Integration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Google Sheets Integration
            </CardTitle>
            <CardDescription>Import and sync your financial data from Google Sheets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authentication Status */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Google Account</h4>
                <p className="text-sm text-muted-foreground">Connect your Google account to access sheets</p>
              </div>
              <div className="flex items-center gap-2">
                {settings?.google_auth_status === 'connected' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('secure-google-tokens', {
                            body: { action: 'revoke' }
                          });
                          if (error) throw error;
                          window.location.reload(); // Simple refresh to update UI
                        } catch (error) {
                          console.error('Failed to disconnect:', error);
                        }
                      }}
                      className="text-red-600 border-red-600 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </>
                ) : settings?.google_auth_status === 'expired' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Expired - Please reconnect</span>
                  </>
                ) : settings?.google_auth_status === 'error' ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Connection Error</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Not Connected</span>
                  </>
                )}
              </div>
            </div>
            
            {settings?.google_auth_status !== 'connected' && (
              <Button
                onClick={() => authenticate.mutate()}
                disabled={authenticate.isPending || isAuthenticating}
                className="w-full flex items-center gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                {authenticate.isPending || isAuthenticating ? 'Connecting...' : 'Connect Google Account'}
              </Button>
            )}

            <Separator />

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateSettings.mutate(data))} className="space-y-4">
                {/* Auto Sync Setting */}
                <FormField
                  control={form.control}
                  name="auto_sync"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Auto Sync</FormLabel>
                        <p className="text-sm text-muted-foreground">Automatically sync data every 5 minutes</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Separator />

                {/* Sheet URL */}
                <FormField
                  control={form.control}
                  name="sheet_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Sheets URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://docs.google.com/spreadsheets/d/..." {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Make sure your sheet has columns: Date, Type, Category, Description, Amount, Person
                      </p>
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => testConnection.mutate(form.getValues('sheet_url'))}
                    disabled={!form.watch('sheet_url') || isTesting}
                  >
                    <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={settings?.google_auth_status !== 'connected' || !form.watch('sheet_url') || isSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Sync Status */}
            {settings?.last_synced && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Last synced: {new Date(settings.last_synced).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">Use dark theme for better visibility</p>
              </div>
              <Switch 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Currency Display</Label>
              <Select 
                value={settings?.currency || 'INR'} 
                onValueChange={(value) => handleSettingChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={settings?.language || 'en'} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="mr">Marathi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive weekly financial summaries</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Budget Alerts</h4>
                <p className="text-sm text-muted-foreground">Get notified when approaching budget limits</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Loan Reminders</h4>
                <p className="text-sm text-muted-foreground">Reminders for lending and borrowing due dates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Import, export, and manage your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => syncData.mutate(settings?.sheet_url)}
                disabled={settings?.google_auth_status !== 'connected' || !settings?.sheet_url || isSyncing}
              >
                <Upload className="h-4 w-4" />
                {isSyncing ? 'Importing...' : 'Import from Sheets'}
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Irreversible actions that will affect your data
              </p>
              <Button variant="destructive" className="mt-2">
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Application information and support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">January 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Support</span>
              <Button variant="link" className="h-auto p-0 text-sm">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}