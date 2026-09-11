import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeeDue } from '@/entities/FeeDue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { format } from 'date-fns';

export default function FeeDefaulterReport() {
  const [defaulters, setDefaulters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const [dueData, studentData] = await Promise.all([
        FeeDue.filter({ status: 'pending' }),
        Student.filter({ status: 'active' })
      ]);
      
      const studentMap = new Map(studentData.map(s => [s.id, s]));
      
      const defaulterSummary = dueData.reduce((acc, due) => {
        if (due.balance_amount > 0) {
          if (!acc[due.student_id]) {
            acc[due.student_id] = { student: studentMap.get(due.student_id), totalDue: 0, lastDueDate: '1970-01-01' };
          }
          acc[due.student_id].totalDue += due.balance_amount;
          if (new Date(due.due_date) > new Date(acc[due.student_id].lastDueDate)) {
              acc[due.student_id].lastDueDate = due.due_date;
          }
        }
        return acc;
      }, {});
      
      const report = Object.values(defaulterSummary).filter(d => d.student).map(d => ({
        ...d.student,
        totalDue: d.totalDue,
        lastDueDate: d.lastDueDate
      }));
      
      setDefaulters(report);
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
    { key: 'guardian_phone', label: 'Mobile' },
    { key: 'totalDue', label: 'Total Due Amount (₹)' },
    { key: 'lastDueDate', label: 'Last Due Date' },
  ];
  
  const reportData = defaulters.map(s => ({
    ...s,
    name: `${s.first_name} ${s.last_name}`,
    lastDueDate: format(new Date(s.lastDueDate), 'yyyy-MM-dd')
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Defaulters Report</CardTitle>
        <CardDescription>A list of all students with outstanding fee payments.</CardDescription>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(reportData, headers, 'fee_defaulters.csv')} disabled={defaulters.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => exportToPdf(reportData, headers, 'Fee Defaulters Report', 'fee_defaulters.pdf')} disabled={defaulters.length === 0}>
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
              ) : defaulters.length > 0 ? (
                reportData.map(item => (
                  <TableRow key={item.id}>
                    {headers.map(h => <TableCell key={h.key}>{item[h.key]}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={headers.length} className="text-center">No fee defaulters found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}