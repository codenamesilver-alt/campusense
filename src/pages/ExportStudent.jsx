
import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function ExportStudent() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    console.log('Loading dropdown data for export student...');
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log(`Loading students for export - Class: ${selectedClass}, Section: ${selectedSection}`);
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSection]);

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections for export student...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Export Student - Classes loaded:', classData.length);
      console.log('Export Student - Sections loaded:', sectionData.length);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections for export student:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading students for export: class=${selectedClass}, section=${selectedSection}`);
      
      const filteredData = await Student.filter({ 
        class: selectedClass, 
        section: selectedSection
      });
      
      console.log('Filtered students for export:', filteredData.length);
      setStudents(filteredData);
    } catch (error) {
      console.error('Error loading students for export:', error);
      alert('Error loading students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails or invalid date
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if parsing fails
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) {
      alert('No students to export. Please select a class and section first.');
      return;
    }

    const csvData = students.map(student => ({
      'Admission Number': student.admission_number || '',
      'Roll Number': student.roll_number || '',
      'First Name': student.first_name || '',
      'Last Name': student.last_name || '',
      'Class': student.class || '',
      'Section': student.section || '',
      'Gender': student.gender || '',
      'Date of Birth': student.date_of_birth ? formatDateToDDMMYYYY(student.date_of_birth) : '',
      'Phone': student.guardian_phone || '',
      'Email': student.guardian_email || '',
      'Date of Admission': student.admission_date ? formatDateToDDMMYYYY(student.admission_date) : '',
      'Father Name': student.father_name || '',
      'Mother Name': student.mother_name || '',
      'Address': student.address || '',
      'Blood Group': student.blood_group || '',
      'House': student.house || '',
      'Status': student.status || '',
      'Photo URL': student.photo_url || ''
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
    link.setAttribute('download', `students_class_${selectedClass}_section_${selectedSection}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (students.length === 0) {
      alert('No students to export. Please select a class and section first.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Student List - Class ${selectedClass} Section ${selectedSection}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; font-size: 20px; }
            .header-info { margin-bottom: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Student Export Report</h1>
          <div class="header-info">
            <p><strong>Class:</strong> ${selectedClass} | <strong>Section:</strong> ${selectedSection}</p>
            <p><strong>Total Students:</strong> ${students.length} | <strong>Generated on:</strong> ${formatDateToDDMMYYYY(new Date().toISOString())}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Father Name</th>
                <th>Phone</th>
                <th>House</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => `
                <tr>
                  <td>${student.admission_number || ''}</td>
                  <td>${student.first_name || ''} ${student.last_name || ''}</td>
                  <td>${student.roll_number || ''}</td>
                  <td>${student.gender || ''}</td>
                  <td>${student.date_of_birth ? formatDateToDDMMYYYY(student.date_of_birth) : ''}</td>
                  <td>${student.father_name || ''}</td>
                  <td>${student.guardian_phone || ''}</td>
                  <td>${student.house || ''}</td>
                  <td>${student.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; font-size: 10px; color: #666;">
            <p>This report was generated from the School Management System on ${formatDateToDDMMYYYY(new Date().toISOString())}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'graduated': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Export Students</h1>
          <p className="text-gray-500">Export student data to Excel or PDF formats</p>
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

      {/* Class and Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Section to Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      {students.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Ready to Export: {students.length} students from Class {selectedClass} Section {selectedSection}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              Export formats available: Excel (.csv) for data manipulation, PDF for printing and reports
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Preview */}
      {selectedClass && selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle>
              Students Preview - Class {selectedClass} Section {selectedSection} ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No students found in this class and section
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
                              <p className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.date_of_birth && formatDateToDDMMYYYY(student.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{student.admission_number}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.roll_number || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{student.gender || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{student.father_name || '-'}</p>
                            <p className="text-xs text-gray-500">{student.guardian_phone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.house || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
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

      {!selectedClass || !selectedSection ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select both class and section to preview and export students</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
