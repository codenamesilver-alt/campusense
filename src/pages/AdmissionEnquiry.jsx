import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/fetchAll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, FileText, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import EnquiryFormDialog from '../components/admission/EnquiryFormDialog';
import DateRangeFilter from '../components/common/DateRangeFilter';

export default function AdmissionEnquiryPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadEnquiries();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, dateRange, showResolved]);

  const loadEnquiries = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAll('AdmissionEnquiry', '-date_of_enquiry');
      setEnquiries(data);
    } catch (error) {
      console.error('Error loading enquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEnquiries = () => {
    let filtered = enquiries;

    // Filter by resolved status
    if (!showResolved) {
      filtered = filtered.filter(enquiry => enquiry.status !== 'admitted' && enquiry.status !== 'closed');
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(enquiry => {
        const enquiryDate = new Date(enquiry.date_of_enquiry);
        return enquiryDate >= dateRange.from && enquiryDate <= dateRange.to;
      });
    }

    setFilteredEnquiries(filtered);
  };

  const handleEnquirySubmit = async (data) => {
    try {
      await base44.entities.AdmissionEnquiry.create(data);
      setShowDialog(false);
      loadEnquiries();
    } catch (error) {
      console.error('Error creating enquiry:', error);
    }
  };

  const handleStatusChange = async (enquiry, newStatus) => {
    try {
      await base44.entities.AdmissionEnquiry.update(enquiry.id, { status: newStatus });
      loadEnquiries();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const exportToExcel = () => {
    const csvData = filteredEnquiries.map(enquiry => ({
      'Student Name': enquiry.student_name,
      'Phone': enquiry.phone,
      'Email': enquiry.email,
      'Class': enquiry.enquiry_for_class,
      'Date of Enquiry': formatDateToDDMMYYYY(enquiry.date_of_enquiry),
      'Current School': enquiry.current_school,
      'Assigned To': enquiry.assigned_to_staff,
      'Status': enquiry.status,
      'Next Follow-up': enquiry.next_followup_date ? formatDateToDDMMYYYY(enquiry.next_followup_date) : ''
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'admission_enquiries.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Admission Enquiries Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Admission Enquiries Report</h1>
          <p>Generated on: ${formatDateToDDMMYYYY(new Date().toISOString())}</p>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Date of Enquiry</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEnquiries.map(enquiry => `
                <tr>
                  <td>${enquiry.student_name}</td>
                  <td>${enquiry.phone}</td>
                  <td>${enquiry.enquiry_for_class}</td>
                  <td>${formatDateToDDMMYYYY(enquiry.date_of_enquiry)}</td>
                  <td>${enquiry.status}</td>
                  <td>${enquiry.assigned_to_staff || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'visit_scheduled': return 'bg-purple-100 text-purple-800';
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admission Enquiry</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Enquiry
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <DateRangeFilter 
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
        
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Show Resolved/Closed
          </label>
          <Button variant="outline" onClick={exportToExcel}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admission Enquiries ({filteredEnquiries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Current School</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading enquiries...
                    </TableCell>
                  </TableRow>
                ) : filteredEnquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No enquiries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell className="font-medium">{enquiry.student_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{enquiry.phone}</div>
                          {enquiry.email && (
                            <div className="text-sm text-gray-500">{enquiry.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{enquiry.enquiry_for_class}</TableCell>
                      <TableCell>{formatDateToDDMMYYYY(enquiry.date_of_enquiry)}</TableCell>
                      <TableCell>{enquiry.current_school || '-'}</TableCell>
                      <TableCell>{enquiry.assigned_to_staff || '-'}</TableCell>
                      <TableCell>
                        {enquiry.next_followup_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {formatDateToDDMMYYYY(enquiry.next_followup_date)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select value={enquiry.status} onValueChange={(value) => handleStatusChange(enquiry, value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue>
                              <Badge className={getStatusColor(enquiry.status)}>
                                {enquiry.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="visit_scheduled">Visit Scheduled</SelectItem>
                            <SelectItem value="admitted">Admitted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EnquiryFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={handleEnquirySubmit}
      />
    </div>
  );
}