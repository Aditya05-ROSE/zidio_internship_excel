import { useState } from 'react';
import { Upload, FileSpreadsheet, BarChart3, Table2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import ExcelUploader from '../components/ExcelUploader';
import DataViewer from '../components/DataViewer';
import ChartViewer from '../components/ChartViewer';
import AnalysisPanel from '../components/AnalysisPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleExcelData = (data: any[], name: string) => {
    setExcelData(data);
    setFileName(name);
    setActiveTab('data');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold">Excel Analyzer</h1>
            </div>
            <div>
              {excelData && (
                <p className="text-sm text-gray-500">
                  Working with: <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <Button
              variant={activeTab === 'upload' ? 'default' : 'ghost'}
              className={activeTab === 'upload' ? 'bg-green-600 text-white' : 'text-gray-600'}
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button
              variant={activeTab === 'data' ? 'default' : 'ghost'}
              className={activeTab === 'data' ? 'bg-green-600 text-white' : 'text-gray-600'}
              onClick={() => setActiveTab('data')}
              disabled={!excelData}
            >
              <Table2 className="mr-2 h-4 w-4" />
              Data
            </Button>
            <Button
              variant={activeTab === 'charts' ? 'default' : 'ghost'}
              className={activeTab === 'charts' ? 'bg-green-600 text-white' : 'text-gray-600'}
              onClick={() => setActiveTab('charts')}
              disabled={!excelData}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Charts
            </Button>
            <Button
              variant={activeTab === 'analysis' ? 'default' : 'ghost'}
              className={activeTab === 'analysis' ? 'bg-green-600 text-white' : 'text-gray-600'}
              onClick={() => setActiveTab('analysis')}
              disabled={!excelData}
            >
              <Download className="mr-2 h-4 w-4" />
              Analysis
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {activeTab === 'upload' && (
            <ExcelUploader onDataLoaded={handleExcelData} />
          )}
          {activeTab === 'data' && excelData && (
            <DataViewer data={excelData} />
          )}
          {activeTab === 'charts' && excelData && (
            <ChartViewer data={excelData} />
          )}
          {activeTab === 'analysis' && excelData && (
            <AnalysisPanel data={excelData} fileName={fileName} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Excel Analyzer © {new Date().getFullYear()} - Process your Excel files directly in your browser
          </p>
        </div>
      </footer>
    </div>
  );
}
