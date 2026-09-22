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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isOverdue = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        d.setHours(0, 0, 0, 0);
        return d < today;
      };

      const balanceCounts = new Map();
      for (const due of dueData) {
        const bal = Number(due.balance_amount);
        const key = `${due.student_id}:${bal}`;
        balanceCounts.set(key, (balanceCounts.get(key) || 0) + 1);
      }

      const tuitionAmount = (studentId) => {
        let bestBal = null;
        let bestCount = 0;
        for (const [key, count] of balanceCounts) {
          const [sid, bal] = key.split(':');
          if (sid === String(studentId) && count > bestCount && count >= 2) {
            bestCount = count;
            bestBal = Number(bal);
          }
        }
        return bestBal;
      };

      const feeLabel = (due) => {
        if (due.fee_head_name) {
          if (/admission/i.test(due.fee_head_name)) return 'Adm';
          if (/annual/i.test(due.fee_head_name)) return 'Ann';
          return format(new Date(due.due_date), 'MMM');
        }
        if (!due.due_date) return null;
        const d = new Date(due.due_date);
        const bal = Number(due.balance_amount);
        const isApril = d.getMonth() === 3;
        if (isApril && bal === 2000) return 'Adm';
        const tuition = tuitionAmount(due.student_id);
        if (isApril && tuition !== null && bal !== tuition) return 'Ann';
        return format(d, 'MMM');
      };

      const defaulterSummary = dueData.reduce((acc, due) => {
        const student = studentMap.get(due.student_id);
        if (!student) return acc;
        if (!(Number(due.balance_amount) > 0)) return acc;
        if (!isOverdue(due.due_date)) return acc;

        if (!acc[due.student_id]) {
          acc[due.student_id] = { student, totalDue: 0, lastDueDate: null, particulars: new Map() };
        }
        const entry = acc[due.student_id];
        entry.totalDue += Number(due.balance_amount);
        if (due.due_date && (!entry.lastDueDate || new Date(due.due_date) > new Date(entry.lastDueDate))) {
          entry.lastDueDate = due.due_date;
        }
        const label = feeLabel(due);
        if (label) {
          entry.particulars.set(label, due.due_date || '');
        }
        return acc;
      }, {});

      const classRank = { PLAYGROUP: 0, NURSERY: 1, KG: 2, 'K.G': 2, K: 2 };
      const classSort = (cls, section) => {
        const key = String(cls || '').trim().toUpperCase().replace('.', '');
        const base = Number.isInteger(Number(key)) ? Number(key) + 2 : (classRank[key] ?? 99);
        const sec = String(section || '').trim().toUpperCase() || 'Z';
        return base * 100 + (sec === 'A' ? 1 : sec === 'B' ? 2 : 99);
      };

      const report = Object.values(defaulterSummary)
        .map(d => ({
          ...d.student,
          totalDue: d.totalDue,
          lastDueDate: d.lastDueDate,
          particulars: Array.from(d.particulars.entries())
            .sort((a, b) => new Date(a[1] || 0) - new Date(b[1] || 0))
            .map(e => e[0])
        }))
        .sort((a, b) => classSort(a.class, a.section) - classSort(b.class, b.section));

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
    { key: 'particulars', label: 'Particulars' },
    { key: 'lastDueDate', label: 'Last Due Date' },
  ];

  const reportData = defaulters.map(s => ({
    ...s,
    name: `${s.first_name} ${s.last_name}`,
    totalDue: `₹ ${Number(s.totalDue).toLocaleString('en-IN')}`,
    particulars: s.particulars && s.particulars.length > 0 ? s.particulars.join(', ') : '-',
    lastDueDate: s.lastDueDate ? format(new Date(s.lastDueDate), 'yyyy-MM-dd') : '-'
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