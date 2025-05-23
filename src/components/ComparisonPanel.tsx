// src/components/ComparisonPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitCompare } from 'lucide-react';
import { type ReportData } from '@/services/warcraftLogsApi';

interface ComparisonPanelProps {
  reportsData: Record<string, ReportData>;
  onCompare: (baselineId: string, compareId: string) => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  reportsData,
  onCompare
}) => {
  const [open, setOpen] = useState(false);
  const [baselineReportId, setBaselineReportId] = useState<string>('');
  const [compareReportId, setCompareReportId] = useState<string>('');

  const reportIds = Object.keys(reportsData);
  const canCompare = reportIds.length >= 2 && baselineReportId && compareReportId && baselineReportId !== compareReportId;

  const handleCompare = () => {
    if (canCompare) {
      onCompare(baselineReportId, compareReportId);
      setOpen(false);
    }
  };

  if (reportIds.length < 2) {
    return null; // Don't show the button if there aren't at least 2 reports to compare
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="absolute top-6 right-40">
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compare Reports</DialogTitle>
          <DialogDescription>
            Select two reports to compare player performance changes between them.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="baseline-report">Baseline Report (Previous)</Label>
            <Select value={baselineReportId} onValueChange={setBaselineReportId}>
              <SelectTrigger>
                <SelectValue placeholder="Select baseline report" />
              </SelectTrigger>
              <SelectContent>
                {reportIds.map((reportId) => (
                  <SelectItem key={reportId} value={reportId}>
                    {reportsData[reportId].reportTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="compare-report">Compare Report (Current)</Label>
            <Select value={compareReportId} onValueChange={setCompareReportId}>
              <SelectTrigger>
                <SelectValue placeholder="Select comparison report" />
              </SelectTrigger>
              <SelectContent>
                {reportIds.map((reportId) => (
                  <SelectItem 
                    key={reportId} 
                    value={reportId}
                    disabled={reportId === baselineReportId}
                  >
                    {reportsData[reportId].reportTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {baselineReportId && compareReportId && baselineReportId === compareReportId && (
            <p className="text-sm text-destructive">
              Please select two different reports to compare.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleCompare} 
            disabled={!canCompare}
            className="w-full"
          >
            Compare Performance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonPanel;