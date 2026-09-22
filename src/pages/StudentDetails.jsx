import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
const Student = base44.entities.Student;
const Class = base44.entities.Class;
const Section = base44.entities.Section;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Download, FileText, Users, Phone, Pencil, Archive
} from "lucide-react";
import StudentEditDialog from "@/components/students/StudentEditDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [highlightAdmission, setHighlightAdmission] = useState("");
  const [disabledStudents, setDisabledStudents] = useState([]);
  const [disabledSearchTerm, setDisabledSearchTerm] = useState("");
  const [disabledFiltered, setDisabledFiltered] = useState([]);

  useEffect(() => {
    loadDisabledStudents();
  }, []);

  useEffect(() => {
    // Read URL params to pre-select class/section and highlight a student
    const params = new URLSearchParams(window.location.search);
    const cls = params.get("class");
    const sec = params.get("section");
    const adm = params.get("admission");
    if (cls) setSelectedClass(cls);
    if (sec) setSelectedSection(sec);
    if (adm) setHighlightAdmission(adm);
    loadDropdownData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  useEffect(() => {
    const filtered = disabledStudents.filter(student =>
      `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase().includes(disabledSearchTerm.toLowerCase()) ||
      String(student.admission_number || '').toLowerCase().includes(disabledSearchTerm.toLowerCase()) ||
      String(student.guardian_phone || '').includes(disabledSearchTerm) ||
      String(student.status || '').toLowerCase().includes(disabledSearchTerm.toLowerCase())
    );
    setDisabledFiltered(filtered);
  }, [disabledStudents, disabledSearchTerm]);

  const loadDisabledStudents = async () => {
    try {
      const all = await Student.list('-created_date', 5000);
      const excluded = all.filter(s => s.status === 'inactive' || s.status === 'deleted');
      const sorted = excluded.sort((a, b) => {
        const aStr = `${a.first_name || ''} ${a.last_name || ''}`;
        const bStr = `${b.first_name || ''} ${b.last_name || ''}`;
        return aStr.localeCompare(bStr);
      });
      setDisabledStudents(sorted);
      setDisabledFiltered(sorted);
    } catch (error) {
      console.error('Error loading disabled/deleted students:', error);
      alert('Error loading disabled/deleted students: ' + error.message);
    }
  };

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Classes loaded:', classData);
      console.log('Sections loaded:', sectionData);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const query = {};
      if (selectedClass !== "all") query.class = selectedClass;
      if (selectedSection !== "all") query.section = selectedSection;

      const filteredData = await Student.filter(query);
      const nonDeletedData = filteredData.filter(s => s.status !== 'deleted');

      const sorted = nonDeletedData.sort((a, b) => {
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
      console.error('Error loading students:', error);
      alert('Error loading students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_phone?.includes(searchTerm)
      );
    }

    setFilteredStudents(filtered);
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
    if (filteredStudents.length === 0) return;

    const csvData = filteredStudents.map(student => ({
      'Admission Number': student.admission_number,
      'Name': `${student.first_name} ${student.last_name}`,
      'Class': student.class,
      'Section': student.section,
      'Roll Number': student.roll_number,
      'Gender': student.gender,
      'Date of Birth': student.date_of_birth ? formatDateToDDMMYYYY(student.date_of_birth) : '',
      'Father Name': student.father_name,
      'Mother Name': student.mother_name,
      'Guardian Phone': student.guardian_phone,
      'Guardian Email': student.guardian_email,
      'Address': student.address,
      'Blood Group': student.blood_group,
      'House': student.house,
      'Status': student.status
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
    link.setAttribute('download', `students_class_${selectedClass}_section_${selectedSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (filteredStudents.length === 0) return;

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>Student List - Class ${selectedClass} Section ${selectedSection}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Student List - Class ${selectedClass} Section ${selectedSection}</h1>
          <p>Generated on: ${formatDateToDDMMYYYY(new Date().toISOString())}</p>
          <p>Total Students: ${filteredStudents.length}</p>
          <table>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Gender</th>
                <th>Father Name</th>
                <th>Phone</th>
                <th>House</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map(student => `
                <tr>
                  <td>${student.admission_number}</td>
                  <td>${student.first_name} ${student.last_name}</td>
                  <td>${student.roll_number || ''}</td>
                  <td>${student.gender || ''}</td>
                  <td>${student.father_name || ''}</td>
                  <td>${student.guardian_phone || ''}</td>
                  <td>${student.house || ''}</td>
                  <td>${student.status}</td>
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

  const toggleNewAdmission = async (student) => {
    const newValue = !student.is_new_admission;
    // Optimistic update
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_new_admission: newValue } : s));
    try {
      await Student.update(student.id, { is_new_admission: newValue });
    } catch (error) {
      // Revert on failure
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_new_admission: student.is_new_admission } : s));
      alert('Failed to update student. Please try again.');
    }
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-gray-500">View student information by class and section</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            <Users className="h-4 w-4 mr-2" />
            Active Students
          </TabsTrigger>
          <TabsTrigger value="disabled">
            <Archive className="h-4 w-4 mr-2" />
            Disabled/Deleted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
      {/* Class and Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (
                     <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Export */}
      {(students.length > 0 || isLoading) && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, admission number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileText className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      )}

      {/* Student Table */}
      <>
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students{selectedClass !== "all" ? ` - Class ${selectedClass}` : ""}{selectedSection !== "all" ? ` Section ${selectedSection}` : ""} ({filteredStudents.length})
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
                    <TableHead>New Admission</TableHead>
                    <TableHead>Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {students.length === 0 ? 'No students found in this class and section' : 'No students found matching your search'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} style={highlightAdmission && student.admission_number === highlightAdmission ? { background: 'rgba(0,245,255,0.08)', outline: '2px solid rgba(0,245,255,0.4)' } : {}}>
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
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              <span>{student.guardian_phone || '-'}</span>
                            </div>
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
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <Switch
                              checked={!!student.is_new_admission}
                              onCheckedChange={() => toggleNewAdmission(student)}
                            />
                            <span className={`text-xs font-medium ${student.is_new_admission ? 'text-green-600' : 'text-gray-400'}`}>
                              {student.is_new_admission ? 'New' : 'Old'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setEditingStudent(student)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      {editingStudent && (
        <StudentEditDialog
          student={editingStudent}
          open={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={loadStudents}
        />
      )}
      </>
      </TabsContent>

        <TabsContent value="disabled" className="space-y-6">
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search disabled/deleted students..."
              value={disabledSearchTerm}
              onChange={(e) => setDisabledSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Disabled/Deleted Students ({disabledFiltered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Guardian Name</TableHead>
                    <TableHead>Guardian Phone</TableHead>
                    <TableHead>Disable Reason</TableHead>
                    <TableHead>Disabled Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disabledFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        {disabledStudents.length === 0 ? 'No disabled or deleted students found' : 'No students found matching your search'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    disabledFiltered.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-medium text-sm">
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
                          <span className="font-mono text-sm">{student.admission_number || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.class || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.section || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{student.roll_number || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.father_name || student.mother_name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.guardian_phone || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.disable_reason || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.disabled_date ? formatDateToDDMMYYYY(student.disabled_date) : '-'}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}