import { RaidProgressAnalysis } from '../types/comparison';
import { AnalysisMetadata } from '../types/storage';

export interface AIReportConfig {
  apiKey: string;
  provider: 'huggingface' | 'gemini';
}

export interface AIReportInsight {
  type: 'performance_improvement' | 'performance_decline' | 'low_attendance' | 'general';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  playerName?: string;
  metric?: number;
}

export interface AIGeneratedReport {
  summary: string;
  insights: AIReportInsight[];
  generatedAt: Date;
  analysisCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export class AIReportService {
  private config: AIReportConfig | null = null;

  setConfig(config: AIReportConfig) {
    this.config = config;
  }

  async generateReport(
    timelineAnalysis: RaidProgressAnalysis,
    analysisMetadata: AnalysisMetadata[]
  ): Promise<AIGeneratedReport> {
    if (!this.config) {
      throw new Error('AI service not configured. Please set API key first.');
    }

    // Extract insights from the data
    const insights = this.extractInsights(timelineAnalysis);
    
    // Prepare data for AI analysis
    const analysisData = this.prepareAnalysisData(timelineAnalysis, analysisMetadata);
    
    // Generate AI report
    const aiSummary = await this.callAIService(analysisData, insights);

    return {
      summary: aiSummary,
      insights,
      generatedAt: new Date(),
      analysisCount: timelineAnalysis.summary.totalReports,
      dateRange: {
        start: timelineAnalysis.summary.dateRange.start,
        end: timelineAnalysis.summary.dateRange.end
      }
    };
  }

  private extractInsights(analysis: RaidProgressAnalysis): AIReportInsight[] {
    const insights: AIReportInsight[] = [];

    // Check for significant performance improvements (>15%)
    analysis.playerProgressions.forEach(player => {
      if (player.totalChange >= 15) {
        insights.push({
          type: 'performance_improvement',
          severity: player.totalChange >= 25 ? 'high' : 'medium',
          title: `Significant Performance Improvement`,
          description: `${player.playerName} (${player.spec} ${player.class}) improved by ${player.totalChange}% from ${player.firstReportAverage}% to ${player.lastReportAverage}%`,
          playerName: player.playerName,
          metric: player.totalChange
        });
      }
    });

    // Check for significant performance declines (>15%)
    analysis.playerProgressions.forEach(player => {
      if (player.totalChange <= -15) {
        insights.push({
          type: 'performance_decline',
          severity: player.totalChange <= -25 ? 'high' : 'medium',
          title: `Significant Performance Decline`,
          description: `${player.playerName} (${player.spec} ${player.class}) declined by ${Math.abs(player.totalChange)}% from ${player.firstReportAverage}% to ${player.lastReportAverage}%`,
          playerName: player.playerName,
          metric: Math.abs(player.totalChange)
        });
      }
    });

    // Check for low attendance (players appearing in <70% of reports)
    const totalReports = analysis.summary.totalReports;
    analysis.playerProgressions.forEach(player => {
      const attendanceRate = (player.dataPoints.length / totalReports) * 100;
      if (attendanceRate < 70) {
        insights.push({
          type: 'low_attendance',
          severity: attendanceRate < 50 ? 'high' : 'medium',
          title: `Low Attendance Rate`,
          description: `${player.playerName} (${player.spec} ${player.class}) attended only ${player.dataPoints.length}/${totalReports} raids (${Math.round(attendanceRate)}%)`,
          playerName: player.playerName,
          metric: Math.round(attendanceRate)
        });
      }
    });

    return insights.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private prepareAnalysisData(analysis: RaidProgressAnalysis, metadata: AnalysisMetadata[]) {
    return {
      raidTrend: analysis.raidTrend,
      overallChange: analysis.overallChange,
      totalReports: analysis.summary.totalReports,
      dateRange: analysis.summary.dateRange,
      playersImproving: analysis.summary.playersImproving,
      playersStable: analysis.summary.playersStable,
      playersDeclining: analysis.summary.playersDeclining,
      averageRaidImprovement: analysis.summary.averageRaidImprovement,
      reportSnapshots: analysis.reportSnapshots.map(snapshot => ({
        title: snapshot.reportTitle,
        date: snapshot.formattedDate,
        raidAverage: snapshot.raidAverages.totalAverage,
        playerCount: snapshot.raidAverages.playerCount
      })),
      topPerformers: analysis.playerProgressions
        .filter(p => p.lastReportAverage >= 90)
        .slice(0, 5)
        .map(p => ({
          name: p.playerName,
          class: p.class,
          spec: p.spec,
          performance: p.lastReportAverage,
          improvement: p.totalChange
        })),
      concerningPlayers: analysis.playerProgressions
        .filter(p => p.totalChange <= -15 || p.lastReportAverage < 50)
        .slice(0, 5)
        .map(p => ({
          name: p.playerName,
          class: p.class,
          spec: p.spec,
          performance: p.lastReportAverage,
          change: p.totalChange
        }))
    };
  }

  private async callAIService(analysisData: any, insights: AIReportInsight[]): Promise<string> {
    if (!this.config) {
      throw new Error('AI service not configured');
    }

    const prompt = this.buildPrompt(analysisData, insights);

    if (this.config.provider === 'huggingface') {
      return await this.callHuggingFace(prompt);
    } else {
      return await this.callGemini(prompt);
    }
  }

  private buildPrompt(analysisData: any, insights: AIReportInsight[]): string {
    return `You are a World of Warcraft raid analyst. Generate a concise raid performance report based on the following data:

RAID OVERVIEW:
- Analysis Period: ${analysisData.dateRange.start} to ${analysisData.dateRange.end}
- Total Reports: ${analysisData.totalReports}
- Overall Raid Trend: ${analysisData.raidTrend} (${analysisData.overallChange}% change)
- Player Status: ${analysisData.playersImproving} improving, ${analysisData.playersStable} stable, ${analysisData.playersDeclining} declining

KEY INSIGHTS DETECTED:
${insights.map(insight => `- ${insight.title}: ${insight.description}`).join('\n')}

TOP PERFORMERS:
${analysisData.topPerformers.map((p: any) => `- ${p.name} (${p.spec} ${p.class}): ${p.performance}% performance`).join('\n')}

RAID PROGRESSION:
${analysisData.reportSnapshots.map((r: any, i: number) => `${i + 1}. ${r.title} (${r.date}): ${r.raidAverage}% avg, ${r.playerCount} players`).join('\n')}

Please generate a professional raid report summary in plain text format. Focus on:
1. Overall raid progression and trends
2. Key performance improvements and concerns
3. Attendance issues if any
4. Brief recommendations for the raid team

Keep it concise but informative, around 200-300 words.`;
  }

  private async callHuggingFace(prompt: string): Promise<string> {
    if (!this.config?.apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    try {
      // Using a better text generation model
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Handle model loading case
        if (response.status === 503) {
          throw new Error('Model is loading, please try again in a few moments');
        }
        throw new Error(`Hugging Face API error: ${errorText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data) && data.length > 0) {
        return data[0]?.generated_text || 'Failed to generate report';
      } else if (data.generated_text) {
        return data.generated_text;
      } else {
        throw new Error('Unexpected response format from Hugging Face');
      }
    } catch (error) {
      console.error('Hugging Face API call failed:', error);
      throw new Error(`Failed to generate AI report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.config?.apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional World of Warcraft raid analyst who creates clear, actionable reports for raid leaders. ${prompt}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Gemini API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate report';
    } catch (error) {
      console.error('Google Gemini API call failed:', error);
      throw new Error(`Failed to generate AI report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aiReportService = new AIReportService(); 