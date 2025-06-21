import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Download } from 'lucide-react';

interface ChartViewerProps {
  data: any[];
}

// Define custom colors for charts
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const ChartViewer: React.FC<ChartViewerProps> = ({ data }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxisField, setXAxisField] = useState<string>('');
  const [yAxisFields, setYAxisFields] = useState<string[]>([]);
  
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

  // Get categorical/text columns
  const categoricalColumns = useMemo(() => {
    return columns.filter(col => !isNumericColumn(col));
  }, [columns, data]);

  // Set default selections when columns change
  useMemo(() => {
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      setXAxisField(categoricalColumns[0]);
      setYAxisFields([numericColumns[0]]);
    }
  }, [categoricalColumns, numericColumns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0 || !xAxisField || yAxisFields.length === 0) {
      return [];
    }

    // Group data by X axis field for bar and line charts
    if (chartType === 'bar' || chartType === 'line') {
      const groupedData: { [key: string]: any } = {};
      
      data.forEach(item => {
        const xValue = String(item[xAxisField] || 'undefined');
        
        if (!groupedData[xValue]) {
          groupedData[xValue] = { [xAxisField]: xValue };
          
          // Initialize with 0 values
          yAxisFields.forEach(field => {
            groupedData[xValue][field] = 0;
          });
        }
        
        // Sum numeric values
        yAxisFields.forEach(field => {
          const value = Number(item[field]) || 0;
          groupedData[xValue][field] += value;
        });
      });
      
      return Object.values(groupedData);
    }
    
    // Prepare data for pie chart
    if (chartType === 'pie') {
      // For pie chart, only first Y axis field is used
      const yField = yAxisFields[0];
      
      const groupedData: { [key: string]: any } = {};
      
      data.forEach(item => {
        const xValue = String(item[xAxisField] || 'undefined');
        
        if (!groupedData[xValue]) {
          groupedData[xValue] = { 
            name: xValue, 
            value: 0 
          };
        }
        
        // Sum the values
        groupedData[xValue].value += Number(item[yField]) || 0;
      });
      
      return Object.values(groupedData);
    }
    
    return [];
  }, [data, xAxisField, yAxisFields, chartType]);

  // Handle Y axis field toggle
  const toggleYAxisField = (field: string) => {
    if (yAxisFields.includes(field)) {
      if (yAxisFields.length > 1) { // Ensure at least one field is selected
        setYAxisFields(yAxisFields.filter(f => f !== field));
      }
    } else {
      setYAxisFields([...yAxisFields, field]);
    }
  };

  // Export chart as image
  const exportChart = () => {
    const svgElement = document.querySelector('.recharts-wrapper svg');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      // Download the image
      const downloadLink = document.createElement('a');
      downloadLink.download = `chart_export_${new Date().getTime()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!data || data.length === 0) {
    return <div className="text-center py-10">No data available for visualization</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Data Visualization</h2>
        <p className="text-gray-600 mb-6">
          Select chart type and fields to visualize your Excel data
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Chart Type</label>
            <Tabs defaultValue={chartType} onValueChange={setChartType} className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="bar" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" /> Bar
                </TabsTrigger>
                <TabsTrigger value="line" className="flex items-center gap-1">
                  <LineChartIcon className="h-4 w-4" /> Line
                </TabsTrigger>
                <TabsTrigger value="pie" className="flex items-center gap-1">
                  <PieChartIcon className="h-4 w-4" /> Pie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">X-Axis (Category)</label>
            <Select value={xAxisField} onValueChange={setXAxisField}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-Axis field" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(column => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Y-Axis (Values)</label>
          <div className="flex flex-wrap gap-2">
            {numericColumns.map(column => (
              <Button
                key={column}
                variant={yAxisFields.includes(column) ? "default" : "outline"}
                className={`text-sm ${
                  yAxisFields.includes(column) ? "bg-green-600 text-white" : "text-gray-700"
                }`}
                onClick={() => toggleYAxisField(column)}
              >
                {column}
              </Button>
            ))}
          </div>
          {chartType === 'pie' && yAxisFields.length > 1 && (
            <p className="text-amber-600 text-sm mt-2">
              Note: Pie chart displays only the first selected value field.
            </p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={exportChart} className="bg-green-600 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export Chart
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white h-96">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisField} 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {yAxisFields.map((field, index) => (
                  <Bar 
                    key={field} 
                    dataKey={field} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    name={field} 
                  />
                ))}
              </BarChart>
            )}
            
            {chartType === 'line' && (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisField} 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {yAxisFields.map((field, index) => (
                  <Line 
                    key={field} 
                    type="monotone" 
                    dataKey={field} 
                    stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                    name={field}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            )}
            
            {chartType === 'pie' && (
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Tooltip />
                <Legend />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select X and Y axis fields to generate a chart
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartViewer;
