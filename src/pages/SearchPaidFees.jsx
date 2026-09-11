import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeesPayment } from '@/entities/FeesPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, Receipt, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function SearchPaidFees() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (selectedClass && selectedSection && selectedMonth) {
      loadStudentsAndPayments();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSection, selectedMonth]);

  const loadStudentsAndPayments = async () => {
    try {
      setIsLoading(true);
      
      // Load students for the selected class and section
      const studentData = await Student.filter({ 
        class: selectedClass, 
        section: selectedSection,
        status: 'active'
      });
      
      // Load payment records for the selected month
      const paymentData = await FeesPayment.filter({ month: selectedMonth });
      
      // Combine student data with payment status
      const studentsWithPaymentStatus = studentData.map(student => {
        const payment = paymentData.find(p => p.student_id === student.id);
        return {
          ...student,
          payment_status: payment ? 'paid' : 'unpaid',
          payment_details: payment || null
        };
      });
      
      setStudents(studentsWithPaymentStatus);
      setPayments(paymentData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchByReceipt = async () => {
    if (!receiptSearch.trim()) {
      alert('Please enter a receipt number');
      return;
    }

    try {
      const paymentData = await FeesPayment.filter({ receipt_number: receiptSearch });
      if (paymentData.length > 0) {
        const payment = paymentData[0];
        const student = await Student.filter({ id: payment.student_id });
        setReceiptDetails({
          ...payment,
          student_info: student[0] || null
        });
      } else {
        alert('No receipt found with this number');
        setReceiptDetails(null);
      }
    } catch (error) {
      console.error('Error searching receipt:', error);
      alert('Error searching receipt');
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) {
      alert('No data to export');
      return;
    }

    const csvData = students.map(student => ({
      'Admission Number': student.admission_number,
      'Student Name': `${student.first_name} ${student.last_name}`,
      'Class': student.class,
      'Section': student.section,
      'Phone': student.guardian_phone,
      'Month': selectedMonth,
      'Payment Status': student.payment_status,
      'Amount Paid': student.payment_details?.amount || 'N/A',
      'Payment Date': student.payment_details?.payment_date ? format(new Date(student.payment_details.payment_date), 'dd/MM/yyyy') : 'N/A',
      'Receipt Number': student.payment_details?.receipt_number || 'N/A'
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
    link.setAttribute('download', `fees_report_${selectedClass}_${selectedSection}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (students.length === 0) {
      alert('No data to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    const paidStudents = students.filter(s => s.payment_status === 'paid');
    const unpaidStudents = students.filter(s => s.payment_status === 'unpaid');
    
    const htmlContent = `
      <html>
        <head>
          <title>Fees Payment Report - Class ${selectedClass} Section ${selectedSection}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; font-size: 18px; }
            .summary { background-color: #f9f9f9; padding: 10px; margin: 10px 0; }
            .paid { color: green; font-weight: bold; }
            .unpaid { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Fees Payment Report</h1>
          <div class="summary">
            <p><strong>Class:</strong> ${selectedClass} | <strong>Section:</strong> ${selectedSection} | <strong>Month:</strong> ${selectedMonth}</p>
            <p><strong>Total Students:</strong> ${students.length} | <strong>Paid:</strong> ${paidStudents.length} | <strong>Unpaid:</strong> ${unpaidStudents.length}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Receipt No.</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td>${student.admission_number}</td>
                  <td>${student.first_name} ${student.last_name}</td>
                  <td>${student.guardian_phone || ''}</td>
                  <td class="${student.payment_status}">${student.payment_status.toUpperCase()}</td>
                  <td>${student.payment_details?.amount || 'N/A'}</td>
                  <td>${student.payment_details?.payment_date ? format(new Date(student.payment_details.payment_date), 'dd/MM/yyyy') : 'N/A'}</td>
                  <td>${student.payment_details?.receipt_number || 'N/A'}</td>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Search Paid Fees</h1>
          <p className="text-gray-500">View and manage fee payment records</p>
        </div>
        {students.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileText className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Receipt Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Search by Receipt Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="receiptSearch">Receipt Number</Label>
              <Input
                id="receiptSearch"
                placeholder="Enter receipt number"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
              />
            </div>
            <Button onClick={searchByReceipt}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          
          {receiptDetails && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Receipt Found</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Receipt No:</strong> {receiptDetails.receipt_number}</div>
                <div><strong>Amount:</strong> ${receiptDetails.amount}</div>
                <div><strong>Student:</strong> {receiptDetails.student_info ? `${receiptDetails.student_info.first_name} ${receiptDetails.student_info.last_name}` : 'N/A'}</div>
                <div><strong>Payment Date:</strong> {format(new Date(receiptDetails.payment_date), 'dd/MM/yyyy')}</div>
                <div><strong>Month:</strong> {receiptDetails.month}</div>
                <div><strong>Payment Method:</strong> {receiptDetails.payment_method}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class/Section/Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class, Section & Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                  {Array.from({length: 12}, (_, i) => (
                    <SelectItem key={i} value={`${i + 1}`}>Class {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {selectedClass && selectedSection && selectedMonth && (
        <Card>
          <CardHeader>
            <CardTitle>
              Payment Status - Class {selectedClass} Section {selectedSection} ({selectedMonth})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Receipt No.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.first_name} {student.last_name}</p>
                              <p className="text-sm text-gray-500">Class {student.class}-{student.section}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{student.admission_number}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{student.guardian_phone || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={student.payment_status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {student.payment_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {student.payment_details?.amount ? `$${student.payment_details.amount}` : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {student.payment_details?.payment_date 
                              ? format(new Date(student.payment_details.payment_date), 'dd/MM/yyyy')
                              : 'N/A'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {student.payment_details?.receipt_number || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClass || !selectedSection || !selectedMonth ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select class, section, and month to view payment records</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}