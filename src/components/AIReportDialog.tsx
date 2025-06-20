import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, AlertTriangle, TrendingUp, TrendingDown, Users, Copy, CheckCircle } from 'lucide-react';
import { aiReportService, AIReportConfig, AIGeneratedReport } from '../services/aiReportService';
import { RaidProgressAnalysis } from '../types/comparison';
import { AnalysisMetadata } from '../types/storage';
import { cn } from '@/lib/utils';

interface AIReportDialogProps {
  timelineAnalysis: RaidProgressAnalysis | null;
  analysisMetadata: AnalysisMetadata[];
  disabled?: boolean;
}

const AIReportDialog: React.FC<AIReportDialogProps> = ({
  timelineAnalysis,
  analysisMetadata,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'huggingface' | 'gemini'>('huggingface');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<AIGeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReport = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!timelineAnalysis) {
      setError('No timeline analysis data available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const config: AIReportConfig = {
        apiKey: apiKey.trim(),
        provider
      };

      aiReportService.setConfig(config);
      const report = await aiReportService.generateReport(timelineAnalysis, analysisMetadata);
      setGeneratedReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = async () => {
    if (!generatedReport) return;

    const reportText = `RAID PERFORMANCE REPORT
Generated: ${generatedReport.generatedAt.toLocaleDateString()}
Analysis Period: ${generatedReport.dateRange.start} to ${generatedReport.dateRange.end}
Reports Analyzed: ${generatedReport.analysisCount}

${generatedReport.summary}

KEY INSIGHTS:
${generatedReport.insights.map(insight => `• ${insight.title}: ${insight.description}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance_improvement':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'performance_decline':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'low_attendance':
        return <Users className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'bg-red-500/20 text-red-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      low: 'bg-blue-500/20 text-blue-400'
    };

    return (
      <Badge className={cn('capitalize', variants[severity as keyof typeof variants])}>
        {severity}
      </Badge>
    );
  };

  const canGenerate = timelineAnalysis && timelineAnalysis.summary.totalReports >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || !canGenerate}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          Generate AI Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Raid Performance Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!canGenerate && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need at least 2 raid reports to generate an AI analysis. Please add more reports first.
              </AlertDescription>
            </Alert>
          )}

          {canGenerate && !generatedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={provider} onValueChange={(value: 'huggingface' | 'gemini') => setProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="huggingface">Hugging Face (Free)</SelectItem>
                      <SelectItem value="gemini">Google Gemini (Free)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'huggingface' ? 'hf_...' : 'AIza...'}
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your API key is only used for this session and is not stored. 
                  {provider === 'huggingface' 
                    ? ' Get your free Hugging Face API key at huggingface.co/settings/tokens'
                    : ' Get your free Google Gemini API key at aistudio.google.com/app/apikey'
                  }
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating || !apiKey.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Report
                  </>
                )}
              </Button>
            </div>
          )}

          {generatedReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Generated Report</h3>
                  <p className="text-sm text-muted-foreground">
                    {generatedReport.dateRange.start} to {generatedReport.dateRange.end} • {generatedReport.analysisCount} reports
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyReport}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Report
                    </>
                  )}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedReport.summary}
                    readOnly
                    className="min-h-[200px] resize-none"
                  />
                </CardContent>
              </Card>

              {generatedReport.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights ({generatedReport.insights.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {generatedReport.insights.map((insight, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
                        >
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{insight.title}</span>
                              {getSeverityBadge(insight.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setGeneratedReport(null);
                    setError(null);
                  }}
                >
                  Generate New Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIReportDialog; 