import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeesPayment } from '@/entities/FeesPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Mail, MessageSquare, Download, FileText, Phone } from 'lucide-react';

export default function FeesReminderPage() {
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (selectedMonth) {
      loadStudentsWithPendingFees();
    } else {
      setStudents([]);
    }
  }, [selectedMonth]);

  const loadStudentsWithPendingFees = async () => {
    try {
      setIsLoading(true);
      
      // Load all active students
      const allStudents = await Student.filter({ status: 'active' });
      
      // Load payments for the selected month
      const payments = await FeesPayment.filter({ month: selectedMonth });
      const paidStudentIds = payments.map(p => p.student_id);
      
      // Filter students who haven't paid for the selected month
      const studentsWithPendingFees = allStudents.filter(student => 
        !paidStudentIds.includes(student.id)
      );
      
      setStudents(studentsWithPendingFees);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error loading students with pending fees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (studentId, checked) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const sendReminders = async (method) => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to send reminders');
      return;
    }

    const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));
    
    // Simulate sending reminders
    try {
      setIsLoading(true);
      
      // Here you would integrate with actual email/SMS/app notification services
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      alert(`${method.toUpperCase()} reminders sent successfully to ${selectedStudents.length} students!`);
      setSelectedStudents([]);
    } catch (error) {
      console.error(`Error sending ${method} reminders:`, error);
      alert(`Error sending ${method} reminders. Please try again.`);
    } finally {
      setIsLoading(false);
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
      'Email': student.guardian_email,
      'Father Name': student.father_name,
      'Mother Name': student.mother_name,
      'Address': student.address,
      'Pending Month': selectedMonth,
      'Status': 'Pending Payment'
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
    link.setAttribute('download', `pending_fees_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
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
    const htmlContent = `
      <html>
        <head>
          <title>Pending Fees Report - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; font-size: 18px; }
            .summary { background-color: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffeaa7; }
          </style>
        </head>
        <body>
          <h1>Pending Fees Report - ${selectedMonth}</h1>
          <div class="summary">
            <p><strong>Total Students with Pending Fees:</strong> ${students.length}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Father Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td>${student.admission_number}</td>
                  <td>${student.first_name} ${student.last_name}</td>
                  <td>${student.class}-${student.section}</td>
                  <td>${student.guardian_phone || 'N/A'}</td>
                  <td>${student.guardian_email || 'N/A'}</td>
                  <td>${student.father_name || 'N/A'}</td>
                  <td style="color: red; font-weight: bold;">PENDING</td>
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
          <h1 className="text-2xl font-bold">Fees Reminder</h1>
          <p className="text-gray-500">Send payment reminders to students with pending fees</p>
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

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Month for Fees Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="month">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month for pending fees check" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students with Pending Fees */}
      {selectedMonth && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Students with Pending Fees - {selectedMonth} ({students.length})
              </CardTitle>
              {students.length > 0 && selectedStudents.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => sendReminders('app')} 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Send App Notification ({selectedStudents.length})
                  </Button>
                  <Button 
                    onClick={() => sendReminders('sms')} 
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send SMS ({selectedStudents.length})
                  </Button>
                  <Button 
                    onClick={() => sendReminders('email')} 
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email ({selectedStudents.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading students with pending fees...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {selectedMonth ? 
                          `No students with pending fees for ${selectedMonth}! 🎉` : 
                          'Please select a month to check for pending fees'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleStudentSelect(student.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 font-medium text-sm">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.first_name} {student.last_name}</p>
                              <p className="text-sm text-gray-500">{student.admission_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {student.class}-{student.section}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{student.guardian_phone || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{student.guardian_email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{student.father_name || 'N/A'}</p>
                            <p className="text-gray-500">{student.mother_name || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            PENDING {selectedMonth}
                          </Badge>
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

      {!selectedMonth && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select a month to view students with pending fees</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}