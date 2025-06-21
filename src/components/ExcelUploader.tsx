import { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, BarChart3 } from 'lucide-react';
import { read, utils } from 'xlsx';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

interface ExcelUploaderProps {
  onDataLoaded: (data: any[], fileName: string) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processExcelFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Read the file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = read(arrayBuffer);
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert worksheet to JSON
      const jsonData = utils.sheet_to_json(worksheet);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Short delay to show 100% progress
      setTimeout(() => {
        onDataLoaded(jsonData, file.name);
        setIsLoading(false);
        setProgress(0);
      }, 500);
      
    } catch (err) {
      setError('Failed to process Excel file. Please check the file format.');
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">Upload Excel File</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-12 w-full max-w-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center w-full">
            <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
            <p className="text-lg font-medium mb-4">Processing your Excel file...</p>
            <Progress value={progress} className="w-full max-w-md" />
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-2">Drag & Drop your Excel file here</p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              Choose Excel File
            </Button>
          </>
        )}
        <input
          type="file"
          id="file-upload"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 text-center max-w-xl">
        <h3 className="text-lg font-medium mb-2">About Excel Analyzer</h3>
        <p className="text-gray-600 mb-4">
          Upload your Excel file to instantly analyze your data, generate charts, and get valuable insights.
          All processing happens in your browser - your data never leaves your computer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium">Data Viewing</h4>
            <p className="text-sm text-gray-500">View and filter your Excel data in a clean table interface</p>
          </div>
          <div className="p-4 border rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium">Visualization</h4>
            <p className="text-sm text-gray-500">Generate beautiful charts from your data</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Upload className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium">Analysis</h4>
            <p className="text-sm text-gray-500">Get statistical summaries and insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;
