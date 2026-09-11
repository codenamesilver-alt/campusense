import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';

export default function AllStudentsReport() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const data = await Student.filter({ status: 'active' });
      const sorted = data.sort((a, b) => {
        const aNum = a.admission_number ? parseInt(a.admission_number, 10) : null;
        const bNum = b.admission_number ? parseInt(b.admission_number, 10) : null;
        if (aNum === null && bNum === null) return 0;
        if (aNum === null) return 1;
        if (bNum === null) return -1;
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.admission_number.localeCompare(b.admission_number);
      });
      setStudents(sorted);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateReport();
  }, []);

  const headers = [
    { key: 'admission_number', label: 'Admission No.' },
    { key: 'name', label: 'Name' },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'guardian_phone', label: 'Mobile' }
  ];

  const reportData = students.map(s => ({
    ...s,
    name: `${s.first_name} ${s.last_name}`
  }));

  const handleExportCsv = () => {
    exportToCsv(reportData, headers, 'all_students_report.csv');
  };
  
  const handleExportPdf = () => {
    exportToPdf(reportData, headers, 'All Students Report', 'all_students_report.pdf');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Students Report</CardTitle>
        <CardDescription>A complete list of all active students in the school.</CardDescription>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Data
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={students.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={students.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map(h => <TableHead key={h.key}>{h.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={headers.length} className="text-center">Loading...</TableCell></TableRow>
              ) : students.length > 0 ? (
                reportData.map(student => (
                  <TableRow key={student.id}>
                    {headers.map(h => <TableCell key={h.key}>{student[h.key]}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={headers.length} className="text-center">No students found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}