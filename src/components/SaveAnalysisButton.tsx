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
import { Save, Check, AlertCircle } from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { RaidProgressAnalysis } from '../types/comparison';

interface SaveAnalysisButtonProps {
  reportData: any[];
  players: any[];
  targetZone: string;
  timelineAnalysis?: RaidProgressAnalysis;
  disabled?: boolean;
  onSaved?: (id: string, name: string) => void;
}

const SaveAnalysisButton: React.FC<SaveAnalysisButtonProps> = ({
  reportData,
  players,
  targetZone,
  timelineAnalysis,
  disabled = false,
  onSaved
}) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisName, setAnalysisName] = useState('');

  // Generate default name when dialog opens
  React.useEffect(() => {
    if (open && !analysisName) {
      const defaultName = analysisService.generateAnalysisName(reportData, targetZone);
      setAnalysisName(defaultName);
    }
  }, [open, reportData, targetZone, analysisName]);

  const handleSave = async () => {
    if (!analysisName.trim()) {
      setError('Please enter a name for this analysis');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const id = await analysisService.saveCurrentAnalysis(
        analysisName.trim(),
        reportData,
        players,
        targetZone,
        timelineAnalysis,
        {
          wipefestEnabled: players.some(p => p.wipefestScore !== undefined),
          authMethod: 'client' // This could be passed as prop if needed
        }
      );

      setSavedId(id);
      onSaved?.(id, analysisName.trim());
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setSavedId(null);
        setAnalysisName('');
      }, 2000);

    } catch (err) {
      console.error('Failed to save analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!saving) {
      setOpen(newOpen);
      if (!newOpen) {
        setError(null);
        setSavedId(null);
        setAnalysisName('');
      }
    }
  };

  const canSave = reportData.length > 0 && players.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || !canSave}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {savedId ? 'Analysis Saved!' : 'Save Raid Analysis'}
          </DialogTitle>
          <DialogDescription>
            {savedId 
              ? 'Your raid analysis has been saved successfully.'
              : 'Save this analysis to review later or compare with future raids.'
            }
          </DialogDescription>
        </DialogHeader>

        {savedId ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Successfully saved!</p>
              <p className="text-sm text-green-600">
                {reportData.length} report{reportData.length !== 1 ? 's' : ''} • {players.length} players
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="analysisName" className="text-right">
                Name
              </Label>
              <Input
                id="analysisName"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                className="col-span-3"
                placeholder="Enter analysis name"
                disabled={saving}
              />
            </div>

            {/* Analysis preview */}
            <div className="col-span-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-2">Analysis Summary:</p>
              <div className="space-y-1 text-gray-600">
                <p>• Zone: {targetZone}</p>
                <p>• Reports: {reportData.length}</p>
                <p>• Players: {players.length}</p>
                {timelineAnalysis && (
                  <p>• Timeline Analysis: {timelineAnalysis.summary.totalReports} reports spanning {timelineAnalysis.summary.dateRange.start} to {timelineAnalysis.summary.dateRange.end}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {!savedId && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !analysisName.trim()}
            >
              {saving ? 'Saving...' : 'Save Analysis'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveAnalysisButton; 