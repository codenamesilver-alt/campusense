
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
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BulkDeleteStudent() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    console.log('Loading dropdown data for bulk delete...');
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log(`Loading students for bulk delete - Class: ${selectedClass}, Section: ${selectedSection}`);
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass, selectedSection]);

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections for bulk delete...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Bulk Delete - Classes loaded:', classData.length);
      console.log('Bulk Delete - Sections loaded:', sectionData.length);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections for bulk delete:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading students for bulk delete: class=${selectedClass}, section=${selectedSection}`);
      
      const filteredData = await Student.filter({ 
        class: selectedClass, 
        section: selectedSection
      });

      const nonDeletedData = filteredData.filter(s => s.status !== 'deleted');
      
      console.log('Filtered students for bulk delete (non-deleted):', nonDeletedData.length);
      setStudents(nonDeletedData);
    } catch (error) {
      console.error('Error loading students for bulk delete:', error);
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

  const handleDeleteStudents = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to delete.');
      return;
    }

    try {
      setIsDeleting(true);
      
      // Mark each selected student as 'deleted'
      for (const studentId of selectedStudents) {
        await Student.update(studentId, { status: 'deleted', disabled_date: new Date().toISOString().split('T')[0] });
      }

      alert(`${selectedStudents.length} student(s) have been marked as deleted.`);
      setShowDialog(false);
      setSelectedStudents([]);
      loadStudents();
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Error deleting students. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'graduated': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      case 'deleted': return 'bg-red-100 text-red-800'; // Added for 'deleted' status
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Delete Students</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Mark students as deleted, removing them from active operations
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">⚠️ Important Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                This action will mark students as 'deleted'. They will be removed from all active lists and operations but a record will be kept for reporting purposes. This action cannot be easily undone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Students - Class {selectedClass} Section {selectedSection} ({students.length})
            </CardTitle>
            {selectedStudents.length > 0 && (
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedStudents.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>⚠️ Confirm Student Deletion</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-800">This is a non-reversible action!</p>
                        <p className="text-sm text-red-700">
                          You are about to mark {selectedStudents.length} student(s) as deleted.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Impact of this action:</strong>
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• Students will not appear in any active lists.</li>
                        <li>• They cannot log in or be included in new transactions.</li>
                        <li>• A record will be maintained for historical reporting.</li>
                      </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteStudents}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Yes, Mark as Deleted
                          </>
                        )}
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
                        No students found in this class and section
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
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select both class and section to view students</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
