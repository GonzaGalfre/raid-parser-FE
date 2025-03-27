// src/components/ConfigPanel.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Settings } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConfigPanelProps {
  reportCode: string;
  setReportCode: (code: string) => void;
  setApiKey: (key: string) => void;
  targetZone: string;
  setTargetZone: (zone: string) => void;
  importWipefestScores: (csv: string) => void;
  fetchReport: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  reportCode,
  setReportCode,
  setApiKey,
  targetZone,
  setTargetZone,
  importWipefestScores,
  fetchReport
}) => {
  const [open, setOpen] = useState(false);
  const [wipefestCsv, setWipefestCsv] = useState('');
  const [localReportCode, setLocalReportCode] = useState(reportCode);
  const [localApiKey, setLocalApiKey] = useState('');
  const [authMethod, setAuthMethod] = useState<'client' | 'token'>('token');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  useEffect(() => {
    // Load saved values from localStorage if available
    const savedClientId = localStorage.getItem('wclClientId');
    const savedClientSecret = localStorage.getItem('wclClientSecret');
    const savedToken = localStorage.getItem('wclApiToken');
    const savedAuthMethod = localStorage.getItem('wclAuthMethod') as 'client' | 'token';
    
    if (savedClientId) setClientId(savedClientId);
    if (savedClientSecret) setClientSecret(savedClientSecret);
    if (savedToken) setLocalApiKey(savedToken);
    if (savedAuthMethod) setAuthMethod(savedAuthMethod);
  }, []);
  
  const fetchOAuthToken = async () => {
    try {
      setTokenLoading(true);
      setTokenError('');
      
      const tokenResponse = await fetch('https://www.warcraftlogs.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get token: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }
      
      const tokenData = await tokenResponse.json();
      setLocalApiKey(tokenData.access_token);
      
      // Save to localStorage
      localStorage.setItem('wclApiToken', tokenData.access_token);
      localStorage.setItem('wclClientId', clientId);
      localStorage.setItem('wclClientSecret', clientSecret);
      localStorage.setItem('wclAuthMethod', 'client');
      
      return tokenData.access_token;
    } catch (err: any) {
      console.error('Error fetching OAuth token:', err);
      setTokenError(err.message || 'Failed to get authentication token');
      return null;
    } finally {
      setTokenLoading(false);
    }
  };
  
  const handleSave = async () => {
    let apiToken = localApiKey;
    
    // If using client credentials, fetch a new token
    if (authMethod === 'client' && clientId && clientSecret) {
      const token = await fetchOAuthToken();
      if (token) {
        apiToken = token;
      } else {
        // Failed to get token, don't proceed
        return;
      }
    } else if (authMethod === 'token') {
      // Using direct token, save to localStorage
      localStorage.setItem('wclApiToken', localApiKey);
      localStorage.setItem('wclAuthMethod', 'token');
    }
    
    setReportCode(localReportCode);
    setApiKey(apiToken);
    setTargetZone("Liberation of Undermine");
    
    if (wipefestCsv.trim()) {
      importWipefestScores(wipefestCsv);
    }
    
    setOpen(false);
    fetchReport();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-6 right-6">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Configure your Warcraft Logs API v2 settings.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={authMethod} onValueChange={(v) => setAuthMethod(v as 'client' | 'token')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client">Client Credentials</TabsTrigger>
            <TabsTrigger value="token">API Token</TabsTrigger>
          </TabsList>
          
          <TabsContent value="client" className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">
                Client ID
              </Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="col-span-3"
                placeholder="WarcraftLogs API Client ID"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientSecret" className="text-right">
                Client Secret
              </Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="col-span-3"
                placeholder="WarcraftLogs API Client Secret"
              />
            </div>
            {tokenError && (
              <div className="text-red-500 text-sm mt-2">{tokenError}</div>
            )}
            <div className="text-sm text-muted-foreground mt-2">
              <p>Get your Client ID and Secret from:</p>
              <a 
                href="https://www.warcraftlogs.com/api/clients/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                https://www.warcraftlogs.com/api/clients/
              </a>
            </div>
          </TabsContent>
          
          <TabsContent value="token" className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiToken" className="text-right">
                API Token
              </Label>
              <Input
                id="apiToken"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                className="col-span-3"
                placeholder="Paste your WarcraftLogs API v2 token"
              />
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              <p>You can manually generate a token and paste it here.</p>
              <p>Get your token from:</p>
              <a 
                href="https://www.warcraftlogs.com/profile" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                https://www.warcraftlogs.com/profile
              </a>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reportCode" className="text-right">
              Report Code
            </Label>
            <Input
              id="reportCode"
              value={localReportCode}
              onChange={(e) => setLocalReportCode(e.target.value)}
              className="col-span-3"
              placeholder="Log report code (e.g. a2bC3d4E)"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Zone</Label>
            <div className="col-span-3">
              <RadioGroup defaultValue="Liberation of Undermine" onValueChange={setTargetZone}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Liberation of Undermine" id="zone-undermine" defaultChecked />
                  <Label htmlFor="zone-undermine">Liberation of Undermine</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wipefestCsv" className="text-right">
              Wipefest CSV
            </Label>
            <Textarea
              id="wipefestCsv"
              value={wipefestCsv}
              onChange={(e) => setWipefestCsv(e.target.value)}
              className="col-span-3"
              placeholder="Paste Wipefest score CSV here (optional)"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={tokenLoading}>
            {tokenLoading ? 'Getting Token...' : 'Save and Fetch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPanel;