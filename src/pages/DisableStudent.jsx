
import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserX, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DisableStudent() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    console.log('Loading dropdown data for disable student...');
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log(`Loading students for disable - Class: ${selectedClass}, Section: ${selectedSection}`);
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass, selectedSection]);

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections for disable student...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Disable - Classes loaded:', classData.length);
      console.log('Disable - Sections loaded:', sectionData.length);
      setClasses(classData);
    } catch (error) {
      console.error('Failed to load classes or sections for disable student:', error);
    }
    try {
      const sectionData = await Section.list('name'); // Assuming this also needs to be fetched
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load sections for disable student:', error);
    }
  };


  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading students for disable: class=${selectedClass}, section=${selectedSection}`);
      
      const filteredData = await Student.filter({ 
        class: selectedClass, 
        section: selectedSection,
        status: 'active'
      });
      
      console.log('Filtered students for disable:', filteredData.length);
      setStudents(filteredData);
    } catch (error) {
      console.error('Error loading students for disable:', error);
      alert('Error loading students: ' + error.message);
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

  const handleDisableStudents = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to disable.');
      return;
    }

    if (!disableReason) {
      alert('Please select a reason for disabling the students.');
      return;
    }

    try {
      const reason = disableReason === 'others' ? customReason : disableReason;
      
      // Update each selected student's status
      for (const studentId of selectedStudents) {
        await Student.update(studentId, {
          status: 'inactive',
          disable_reason: reason,
          disabled_date: new Date().toISOString().split('T')[0]
        });
      }

      alert(`${selectedStudents.length} student(s) have been disabled successfully.`);
      setShowDialog(false);
      setSelectedStudents([]);
      setDisableReason('');
      setCustomReason('');
      loadStudents();
    } catch (error) {
      console.error('Error disabling students:', error);
      alert('Error disabling students. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Disable Student</h1>
          <p className="text-gray-500">Temporarily disable student accounts</p>
        </div>
      </div>

      {/* Class and Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Section</CardTitle>
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

      {/* Students List */}
      {selectedClass && selectedSection && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Active Students - Class {selectedClass} Section {selectedSection} ({students.length})
            </CardTitle>
            {selectedStudents.length > 0 && (
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <UserX className="mr-2 h-4 w-4" />
                    Disable Selected ({selectedStudents.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disable Students</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        You are about to disable {selectedStudents.length} student(s). This will remove them from active class lists.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Disabling *</Label>
                      <Select value={disableReason} onValueChange={setDisableReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terminated">Terminated</SelectItem>
                          <SelectItem value="dropout">Dropout</SelectItem>
                          <SelectItem value="admitted_to_another_school">Admitted to Another School</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {disableReason === 'others' && (
                      <div className="space-y-2">
                        <Label htmlFor="custom_reason">Please explain *</Label>
                        <Textarea
                          id="custom_reason"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Provide detailed reason..."
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDisableStudents}
                        disabled={!disableReason || (disableReason === 'others' && !customReason)}
                      >
                        Disable Students
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Guardian Contact</TableHead>
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
                        No active students found in this class and section
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
                                {student.father_name}
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
                            <p className="text-sm">{student.guardian_phone || '-'}</p>
                            {student.guardian_email && (
                              <p className="text-xs text-gray-500">{student.guardian_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Active
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
              <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select both class and section to view students</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
