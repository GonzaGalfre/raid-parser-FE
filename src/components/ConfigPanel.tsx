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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ConfigPanelProps {
  reportCode: string;
  setReportCode: (code: string) => void;
  setApiKey: (key: string) => void;
  targetZone: string;
  setTargetZone: (zone: string) => void;
  importWipefestScores: (csv: string) => void;
  fetchReport: () => void;
}

const HARDCODED_API_KEY = "122f2d0f15365c7c36b5b04fe99800e7";

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
  
  const handleSave = () => {
    setReportCode(localReportCode);
    setApiKey(HARDCODED_API_KEY); // Use the hardcoded API key
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Configure your Warcraft Logs report settings.
          </DialogDescription>
        </DialogHeader>
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
          <Button onClick={handleSave}>Save and Fetch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPanel;