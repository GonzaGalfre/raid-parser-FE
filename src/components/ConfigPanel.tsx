// src/components/ConfigPanel.tsx
import React, { useState } from 'react';
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

interface ConfigPanelProps {
  reportCode: string;
  setReportCode: (code: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  targetZone: string;
  setTargetZone: (zone: string) => void;
  importWipefestScores: (csv: string) => void;
  fetchReport: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  reportCode,
  setReportCode,
  apiKey,
  setApiKey,
  targetZone,
  setTargetZone,
  importWipefestScores,
  fetchReport
}) => {
  const [open, setOpen] = useState(false);
  const [wipefestCsv, setWipefestCsv] = useState('');
  const [localReportCode, setLocalReportCode] = useState(reportCode);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localTargetZone, setLocalTargetZone] = useState(targetZone);
  
  const handleSave = () => {
    setReportCode(localReportCode);
    setApiKey(localApiKey);
    setTargetZone(localTargetZone);
    
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
          <DialogDescription>
            Configure your Warcraft Logs API settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              className="col-span-3"
              placeholder="Your Warcraft Logs API key"
            />
          </div>
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
            <Label htmlFor="targetZone" className="text-right">
              Zone Name
            </Label>
            <Input
              id="targetZone"
              value={localTargetZone}
              onChange={(e) => setLocalTargetZone(e.target.value)}
              className="col-span-3"
              placeholder="Target raid zone (e.g. Amirdrassil)"
            />
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
          <Button onClick={handleSave}>Save and Fetch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPanel;