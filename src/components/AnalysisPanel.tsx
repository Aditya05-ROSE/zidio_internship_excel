import { useState, useMemo } from 'react';
import { Download, Calculator, Maximize2, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

interface AnalysisPanelProps {
  data: any[];
  fileName: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, fileName }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  // Extract column names and determine types
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Determine if a column is numeric
  const isNumericColumn = (column: string) => {
    if (!data || data.length === 0) return false;
    // Check first few rows to determine if column is numeric
    return data.slice(0, 5).every(row => {
      const value = row[column];
      return value === undefined || value === null || value === '' || 
        (typeof value === 'number' || !isNaN(Number(value)));
    });
  };

  // Get numeric columns
  const numericColumns = useMemo(() => {
    return columns.filter(isNumericColumn);
  }, [columns, data]);

  // Set default selection when columns change
  useMemo(() => {
    if (numericColumns.length > 0) {
      setSelectedColumn(numericColumns[0]);
    }
  }, [numericColumns]);

  // Calculate dataset summary
  const dataSummary = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    return {
      rowCount: data.length,
      columnCount: columns.length,
      numericColumnCount: numericColumns.length,
      categoricalColumnCount: columns.length - numericColumns.length,
    };
  }, [data, columns, numericColumns]);

  // Calculate column statistics
  const columnStats = useMemo(() => {
    if (!data || data.length === 0 || !selectedColumn) return null;
    
    // For numeric columns
    if (isNumericColumn(selectedColumn)) {
      const validValues = data
        .map(row => Number(row[selectedColumn]))
        .filter(val => !isNaN(val));
      
      if (validValues.length === 0) return null;
      
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      const mean = sum / validValues.length;
      
      // Sort for median and percentiles
      const sortedValues = [...validValues].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
      
      // Calculate standard deviation
      const squaredDiffs = validValues.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / validValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Min, max and range
      const min = Math.min(...validValues);
      const max = Math.max(...validValues);
      const range = max - min;
      
      // Count of empty/invalid values
      const emptyCount = data.length - validValues.length;
      
      return {
        type: 'numeric',
        count: validValues.length,
        emptyCount,
        min,
        max,
        range,
        sum,
        mean,
        median,
        stdDev,
        q1: sortedValues[Math.floor(sortedValues.length * 0.25)],
        q3: sortedValues[Math.floor(sortedValues.length * 0.75)],
      };
    } 
    // For categorical columns
    else {
      const valueMap = new Map<string, number>();
      let emptyCount = 0;
      
      data.forEach(row => {
        const value = row[selectedColumn];
        if (value === undefined || value === null || value === '') {
          emptyCount++;
        } else {
          const strValue = String(value);
          valueMap.set(strValue, (valueMap.get(strValue) || 0) + 1);
        }
      });
      
      // Get frequency distribution
      const frequencies = [...valueMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 values
      
      // Calculate unique values count
      const uniqueCount = valueMap.size;
      
      // Find mode (most common value)
      let mode = '';
      let modeFrequency = 0;
      
      valueMap.forEach((freq, value) => {
        if (freq > modeFrequency) {
          modeFrequency = freq;
          mode = value;
        }
      });
      
      return {
        type: 'categorical',
        count: data.length - emptyCount,
        emptyCount,
        uniqueCount,
        mode,
        modeFrequency,
        frequencies,
      };
    }
  }, [data, selectedColumn]);

  // Generate a report as text
  const generateReport = () => {
    if (!data || !dataSummary || !columnStats) return;
    
    let report = `Excel Analysis Report\n`;
    report += `File: ${fileName}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Dataset summary
    report += `Dataset Summary\n`;
    report += `==============\n`;
    report += `Rows: ${dataSummary.rowCount}\n`;
    report += `Columns: ${dataSummary.columnCount}\n`;
    report += `Numeric Columns: ${dataSummary.numericColumnCount}\n`;
    report += `Categorical Columns: ${dataSummary.categoricalColumnCount}\n\n`;
    
    // Column analysis
    report += `Column Analysis: ${selectedColumn}\n`;
    report += `=======================${Array(selectedColumn.length).fill('=').join('')}\n`;
    
    if (columnStats.type === 'numeric') {
      report += `Type: Numeric\n`;
      report += `Valid Values: ${columnStats.count}\n`;
      report += `Empty/Invalid Values: ${columnStats.emptyCount}\n`;
      report += `Minimum: ${columnStats.min.toFixed(2)}\n`;
      report += `Maximum: ${columnStats.max.toFixed(2)}\n`;
      report += `Range: ${columnStats.range.toFixed(2)}\n`;
      report += `Sum: ${columnStats.sum.toFixed(2)}\n`;
      report += `Mean: ${columnStats.mean.toFixed(2)}\n`;
      report += `Median: ${columnStats.median.toFixed(2)}\n`;
      report += `Standard Deviation: ${columnStats.stdDev.toFixed(2)}\n`;
      report += `1st Quartile (Q1): ${columnStats.q1.toFixed(2)}\n`;
      report += `3rd Quartile (Q3): ${columnStats.q3.toFixed(2)}\n`;
    } else {
      report += `Type: Categorical\n`;
      report += `Valid Values: ${columnStats.count}\n`;
      report += `Empty Values: ${columnStats.emptyCount}\n`;
      report += `Unique Values: ${columnStats.uniqueCount}\n`;
      report += `Mode (Most Common): ${columnStats.mode} (${columnStats.modeFrequency} occurrences)\n\n`;
      
      report += `Top Values by Frequency:\n`;
      columnStats.frequencies.forEach(([value, count], index) => {
        report += `${index + 1}. ${value}: ${count} (${((count / data.length) * 100).toFixed(1)}%)\n`;
      });
    }
    
    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_report_${selectedColumn}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data || data.length === 0) {
    return <div className="text-center py-10">No data available for analysis</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Data Analysis</h2>
        <p className="text-gray-600 mb-6">
          Generate statistics and insights from your Excel data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                Dataset Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataSummary && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rows</span>
                    <span className="font-semibold">{dataSummary.rowCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Columns</span>
                    <span className="font-semibold">{dataSummary.columnCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Numeric Columns</span>
                    <span className="font-semibold">{dataSummary.numericColumnCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Text Columns</span>
                    <span className="font-semibold">{dataSummary.categoricalColumnCount}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-green-500" />
                Data Completeness
              </CardTitle>
              <CardDescription>
                Analysis of data quality and missing values
              </CardDescription>
            </CardHeader>
            <CardContent>
              {columnStats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valid Data Points</span>
                    <span className="font-semibold">{columnStats.count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Missing/Invalid Values</span>
                    <Badge variant={columnStats.emptyCount > 0 ? "destructive" : "outline"}>
                      {columnStats.emptyCount}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completeness</span>
                      <span>
                        {((columnStats.count / (columnStats.count + columnStats.emptyCount)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(columnStats.count / (columnStats.count + columnStats.emptyCount)) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="w-64">
            <label className="block text-sm font-medium mb-2">Select Column for Analysis</label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(column => (
                  <SelectItem key={column} value={column}>
                    {column} {isNumericColumn(column) ? '(Numeric)' : '(Text)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={generateReport} className="mt-7 bg-green-600 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export Analysis Report
          </Button>
        </div>

        {selectedColumn && columnStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-500" />
                  Statistics for "{selectedColumn}"
                </CardTitle>
                <CardDescription>
                  {columnStats.type === 'numeric' ? 'Numeric analysis' : 'Categorical analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {columnStats.type === 'numeric' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Minimum</div>
                        <div className="font-medium">{columnStats.min.toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Maximum</div>
                        <div className="font-medium">{columnStats.max.toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Range</div>
                        <div className="font-medium">{columnStats.range.toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Sum</div>
                        <div className="font-medium">{columnStats.sum.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mean</span>
                        <span className="font-semibold">{columnStats.mean.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Median</span>
                        <span className="font-semibold">{columnStats.median.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Standard Deviation</span>
                        <span className="font-semibold">{columnStats.stdDev.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">1st Quartile (Q1)</span>
                        <span className="font-semibold">{columnStats.q1.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">3rd Quartile (Q3)</span>
                        <span className="font-semibold">{columnStats.q3.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Unique Values</div>
                        <div className="font-medium text-lg">{columnStats.uniqueCount}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Most Common</div>
                        <div className="font-medium text-sm truncate" title={columnStats.mode}>
                          {columnStats.mode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {columnStats.modeFrequency} occurrences
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Values</h4>
                      <div className="space-y-2">
                        {columnStats.frequencies.slice(0, 5).map(([value, count]) => (
                          <div key={value} className="flex items-center gap-2">
                            <div className="w-full max-w-md">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="truncate font-medium" title={value}>
                                  {value}
                                </span>
                                <span>{count} ({((count / data.length) * 100).toFixed(1)}%)</span>
                              </div>
                              <Progress 
                                value={(count / data.length) * 100} 
                                className="h-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {columnStats.type === 'numeric' ? (
                    <>
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Data Distribution</h4>
                        <p className="text-sm text-gray-600">
                          {columnStats.mean > columnStats.median ? 
                            'The data is positively skewed (mean > median), suggesting some high outlier values.' : 
                            columnStats.mean < columnStats.median ? 
                            'The data is negatively skewed (mean < median), suggesting some low outlier values.' :
                            'The data appears to be symmetrically distributed (mean ≈ median).'}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Variability Assessment</h4>
                        <p className="text-sm text-gray-600">
                          {(columnStats.stdDev / columnStats.mean) > 0.5 ? 
                            'The coefficient of variation is high, indicating significant variability in your data.' : 
                            'The data shows relatively low variability compared to its average value.'}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Data Quality</h4>
                        <p className="text-sm text-gray-600">
                          {columnStats.emptyCount > 0 ? 
                            `There are ${columnStats.emptyCount} missing values (${((columnStats.emptyCount / data.length) * 100).toFixed(1)}%). Consider addressing these for more reliable analysis.` : 
                            'The column has no missing values, which is excellent for data quality.'}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Next Steps</h4>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Consider visualizing this data as a histogram or box plot</li>
                          <li>Look for correlations with other numeric columns</li>
                          <li>Check for outliers beyond Q1-1.5*IQR and Q3+1.5*IQR</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Distribution Assessment</h4>
                        <p className="text-sm text-gray-600">
                          {columnStats.uniqueCount === data.length ? 
                            'Every value is unique, suggesting this might be an identifier column.' : 
                            columnStats.uniqueCount === 1 ? 
                            'This column has only one unique value, making it unsuitable for analysis.' :
                            columnStats.uniqueCount <= 5 ? 
                            'This column has few unique values, making it suitable for categorical analysis.' :
                            'This column has many unique values. Consider grouping them for better analysis.'}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Dominance Analysis</h4>
                        <p className="text-sm text-gray-600">
                          {(columnStats.modeFrequency / data.length) > 0.8 ? 
                            `The most common value "${columnStats.mode}" dominates this column (${((columnStats.modeFrequency / data.length) * 100).toFixed(1)}% of rows).` : 
                            `The most common value accounts for ${((columnStats.modeFrequency / data.length) * 100).toFixed(1)}% of the data, showing good distribution.`}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Data Quality</h4>
                        <p className="text-sm text-gray-600">
                          {columnStats.emptyCount > 0 ? 
                            `There are ${columnStats.emptyCount} missing values (${((columnStats.emptyCount / data.length) * 100).toFixed(1)}%). Consider addressing these for more reliable analysis.` : 
                            'The column has no missing values, which is excellent for data quality.'}
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <h4 className="font-medium mb-1">Next Steps</h4>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Visualize this data as a pie chart or bar chart</li>
                          <li>Consider using this column for grouping other numeric data</li>
                          {columnStats.uniqueCount > 10 && 
                            <li>The high number of unique values suggests you may want to categorize this data</li>
                          }
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
