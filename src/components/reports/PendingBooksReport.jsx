import { useState } from 'react';
import { BookIssue } from '@/entities/BookIssue';
import { Book } from '@/entities/Book';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { format, differenceInDays } from 'date-fns';

export default function PendingBooksReport() {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      alert("Please select both a start and end date for the issue date range.");
      return;
    }
    setIsLoading(true);
    try {
      const [issueData, bookData] = await Promise.all([
        BookIssue.filter({ status: 'issued' }),
        Book.list()
      ]);
      
      const bookMap = new Map(bookData.map(b => [b.id, b]));
      
      const filtered = issueData.filter(i => {
        const issueDate = new Date(i.issue_date);
        return issueDate >= new Date(dateFrom) && issueDate <= new Date(dateTo);
      }).map(issue => ({
        ...issue,
        book: bookMap.get(issue.book_id) || { title: 'Unknown', author: 'Unknown' },
        daysOverdue: Math.max(0, differenceInDays(new Date(), new Date(issue.due_date)))
      }));
      
      setIssues(filtered);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = [
    { key: 'book_title', label: 'Book Title' },
    { key: 'borrower_name', label: 'Borrower Name' },
    { key: 'borrower_type', label: 'Borrower Type' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'daysOverdue', label: 'Days Overdue' }
  ];
  
  const reportData = issues.map(i => ({
      ...i,
      book_title: i.book.title,
      issue_date: format(new Date(i.issue_date), 'yyyy-MM-dd'),
      due_date: format(new Date(i.due_date), 'yyyy-MM-dd'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Book Issues Report</CardTitle>
        <CardDescription>View books issued within a date range that have not yet been returned.</CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Issue Date From</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Issue Date To</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(reportData, headers, 'pending_books.csv')} disabled={issues.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => exportToPdf(reportData, headers, 'Pending Books Report', 'pending_books.pdf')} disabled={issues.length === 0}>
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
              ) : issues.length > 0 ? (
                reportData.map(item => (
                  <TableRow key={item.id} className={item.daysOverdue > 0 ? 'bg-red-50' : ''}>
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