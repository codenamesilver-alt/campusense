import { useState } from 'react';
import { AdmissionEnquiry } from '@/entities/AdmissionEnquiry';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { format } from 'date-fns';

export default function AdmissionEnquiryReport() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      alert("Please select both a start and end date.");
      return;
    }
    setIsLoading(true);
    try {
      const allEnquiries = await AdmissionEnquiry.list();
      const filtered = allEnquiries.filter(e => {
        const enquiryDate = new Date(e.date_of_enquiry);
        return enquiryDate >= new Date(dateFrom) && enquiryDate <= new Date(dateTo);
      });
      setEnquiries(filtered);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = [
    { key: 'date_of_enquiry', label: 'Enquiry Date' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'enquiry_for_class', label: 'Class' },
    { key: 'status', label: 'Status' }
  ];
  
  const reportData = enquiries.map(e => ({
      ...e,
      date_of_enquiry: format(new Date(e.date_of_enquiry), 'yyyy-MM-dd')
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission Enquiries Report</CardTitle>
        <CardDescription>View admission enquiries within a specific date range.</CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From</Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">To</Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(reportData, headers, 'admission_enquiries.csv')} disabled={enquiries.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => exportToPdf(reportData, headers, 'Admission Enquiries Report', 'admission_enquiries.pdf')} disabled={enquiries.length === 0}>
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
              ) : enquiries.length > 0 ? (
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