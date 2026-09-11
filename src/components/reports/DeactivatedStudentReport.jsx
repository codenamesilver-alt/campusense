import { useState } from 'react';
import { Student } from '@/entities/Student';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { format } from 'date-fns';

export default function DeactivatedStudentReport() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerateReport = async () => {
    if (!status) {
      alert("Please select a status.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await Student.filter({ status });
      setStudents(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = [
    { key: 'admission_number', label: 'Admission No.' },
    { key: 'name', label: 'Name' },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'disabled_date', label: 'Date' },
    { key: 'disable_reason', label: 'Reason' }
  ];
  
  const reportData = students.map(s => ({
      ...s,
      name: `${s.first_name} ${s.last_name}`,
      disabled_date: s.disabled_date ? format(new Date(s.disabled_date), 'yyyy-MM-dd') : 'N/A'
  }));
  
  const reportTitle = status === 'deleted' ? 'Deleted Students Report' : 'Disabled Students Report';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inactive & Deleted Students</CardTitle>
        <CardDescription>Report on students who are no longer active in the school.</CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inactive">Disabled Students</SelectItem>
                <SelectItem value="deleted">Deleted Students</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(reportData, headers, `${status}_students.csv`)} disabled={students.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => exportToPdf(reportData, headers, reportTitle, `${status}_students.pdf`)} disabled={students.length === 0}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>{headers.map(h => <TableHead key={h.key}>{h.label}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={headers.length} className="text-center">Loading...</TableCell></TableRow>
              ) : students.length > 0 ? (
                reportData.map(item => (
                  <TableRow key={item.id}>
                    {headers.map(h => <TableCell key={h.key}>{item[h.key]}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={headers.length} className="text-center">No data found for the selected criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}