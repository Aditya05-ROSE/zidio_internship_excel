import { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';

interface DataViewerProps {
  data: any[];
}

const DataViewer: React.FC<DataViewerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Initialize columns and filtered data
  useEffect(() => {
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setSelectedColumns(cols);
      setFilteredData(data);
    }
  }, [data]);

  // Handle search filtering
  useEffect(() => {
    if (data) {
      if (!searchTerm) {
        setFilteredData(data);
      } else {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const filtered = data.filter(row => {
          return Object.values(row).some(value => 
            String(value).toLowerCase().includes(lowercaseSearchTerm)
          );
        });
        setFilteredData(filtered);
      }
      setCurrentPage(1);
    }
  }, [searchTerm, data]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }

    const sorted = [...filteredData].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      // Handle different types of values
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();

      if (sortDirection === 'asc') {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });

    setFilteredData(sorted);
  };

  // Handle column selection change
  const handleColumnSelectionChange = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  // Handle export as CSV
  const exportCSV = () => {
    // Create header row with selected columns
    const header = selectedColumns.join(',');
    
    // Create data rows
    const csvRows = filteredData.map(row => {
      return selectedColumns.map(column => {
        // Handle values that might contain commas
        const value = row[column] !== undefined ? row[column] : '';
        const valueStr = String(value);
        // Wrap in quotes if contains comma, newline or quote
        return valueStr.includes(',') || valueStr.includes('\n') || valueStr.includes('"') 
          ? `"${valueStr.replace(/"/g, '""')}"` 
          : valueStr;
      }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...csvRows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (!data || data.length === 0) {
    return <div className="text-center py-10">No data available</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search data..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => setRowsPerPage(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportCSV} variant="outline" className="bg-green-600 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Column Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm font-medium flex items-center">
          <Filter className="h-4 w-4 mr-1" /> Visible Columns:
        </span>
        {columns.map(column => (
          <Button
            key={column}
            variant={selectedColumns.includes(column) ? "default" : "outline"}
            className={`text-xs py-1 h-auto ${
              selectedColumns.includes(column) ? "bg-green-600 text-white" : "text-gray-700"
            }`}
            onClick={() => handleColumnSelectionChange(column)}
          >
            {column}
          </Button>
        ))}
      </div>

      {/* Data Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns
                  .filter(column => selectedColumns.includes(column))
                  .map(column => (
                    <TableHead key={column} className="whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort(column)}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        {column}
                        {sortColumn === column && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${
                            sortDirection === 'asc' ? 'transform rotate-180' : ''
                          }`} />
                        )}
                      </Button>
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns
                    .filter(column => selectedColumns.includes(column))
                    .map(column => (
                      <TableCell key={column} className="whitespace-nowrap">
                        {row[column] !== undefined ? String(row[column]) : ''}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(filteredData.length, currentPage * rowsPerPage)} of {filteredData.length} entries
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          <span className="px-3 py-1 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataViewer;
