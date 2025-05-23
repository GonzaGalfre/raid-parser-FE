import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  Users, 
  BarChart3, 
  Trash, 
  Eye, 
  Download,
  RefreshCw,
  Database,
  Filter
} from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { AnalysisMetadata } from '../types/storage';

interface SavedReportsPageProps {
  onLoadAnalysis?: (analysisId: string) => void;
}

const SavedReportsPage: React.FC<SavedReportsPageProps> = ({ onLoadAnalysis }) => {
  const [analyses, setAnalyses] = useState<AnalysisMetadata[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  // Get unique zones for filter
  const zones = Array.from(new Set(analyses.map(a => a.zone)));

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const [analysesData, storageStats] = await Promise.all([
        analysisService.getAllAnalyses(),
        analysisService.getStorageStats()
      ]);
      setAnalyses(analysesData);
      setFilteredAnalyses(analysesData);
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  // Filter analyses based on search and zone
  useEffect(() => {
    let filtered = analyses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(analysis => 
        analysis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.zone.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply zone filter
    if (selectedZone !== 'all') {
      filtered = filtered.filter(analysis => analysis.zone === selectedZone);
    }

    setFilteredAnalyses(filtered);
  }, [analyses, searchQuery, selectedZone]);

  const handleLoadAnalysis = async (id: string) => {
    if (onLoadAnalysis) {
      onLoadAnalysis(id);
    } else {
      // Fallback for when onLoadAnalysis is not provided
      try {
        const analysis = await analysisService.loadAnalysis(id);
        console.log('Loading analysis:', analysis);
        alert('Analysis loading will be implemented in the next step!');
      } catch (error) {
        console.error('Error loading analysis:', error);
      }
    }
  };

  const handleDeleteAnalysis = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      try {
        await analysisService.deleteAnalysis(id);
        await loadAnalyses(); // Reload data
        console.log('Analysis deleted successfully');
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const analysis = await analysisService.loadAnalysis(id);
      console.log('Full analysis data:', analysis);
      alert('Check console for full analysis details');
    } catch (error) {
      console.error('Error loading analysis details:', error);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await analysisService.exportAllData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raid-analyses-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading saved analyses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Saved Analyses</h1>
          <p className="text-muted-foreground">
            Manage and load your previously saved raid performance analyses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalyses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalAnalyses || 0}</p>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{zones.length}</p>
                <p className="text-sm text-muted-foreground">Unique Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats?.newestAnalysis ? 
                    new Date(stats.newestAnalysis).toLocaleDateString() : 
                    'No data'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Latest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalSizeMB?.toFixed(1) || '0.0'} MB</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search analyses by name or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analyses List */}
      {filteredAnalyses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {analyses.length === 0 ? 'No Saved Analyses' : 'No Matching Analyses'}
            </h3>
            <p className="text-muted-foreground">
              {analyses.length === 0 
                ? 'Start by importing and saving your first raid report analysis.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{analysis.name}</h3>
                      <Badge variant="outline">{analysis.zone}</Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {analysis.reportCount} reports
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {analysis.playerCount} players
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average Performance: {analysis.averagePerformance.toFixed(1)} • 
                      Created {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleViewDetails(analysis.id)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleLoadAnalysis(analysis.id)}
                      title="Load Analysis"
                    >
                      Load
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteAnalysis(analysis.id, analysis.name)}
                      title="Delete Analysis"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedReportsPage; 