import { useState, useEffect } from 'react';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Staff } from '@/entities/Staff';
import { base44 } from '@/api/base44Client';
import { ClassTeacherAssignment } from '@/entities/ClassTeacherAssignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AssignClassTeacher() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [classSectionPairs, setClassSectionPairs] = useState([]);
  const [teacherSelections, setTeacherSelections] = useState({});
  const [changedKeys, setChangedKeys] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [academicYear]);

  useEffect(() => {
    if (classes.length > 0 && sections.length > 0) {
      const pairs = [];
      classes.forEach(c => {
        sections.forEach(s => {
          pairs.push({ class: c, section: s });
        });
      });
      setClassSectionPairs(pairs);
    }
  }, [classes, sections]);

  useEffect(() => {
    const selections = {};
    assignments.forEach(a => {
      const key = `${a.class_id}-${a.section_id}`;
      selections[key] = a.teacher_id;
    });
    setTeacherSelections(selections);
  }, [assignments]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classData, sectionData, staffData, sessionData] = await Promise.all([
        Class.list('numeric_value'),
        Section.list('name'),
        Staff.list(),
        base44.entities.Session.list()
      ]);
      setAvailableSessions(sessionData);
      const currentSession = sessionData.find(s => s.is_current) || sessionData[0];
      if (currentSession) setAcademicYear(currentSession.name);
      
      console.log('All staff loaded:', staffData);
      
      // Filter for teachers - check multiple possible role values
      const teacherData = staffData.filter(s => 
        s.role === 'teacher' || 
        s.role === 'Teacher' || 
        s.designation?.toLowerCase().includes('teacher')
      );
      
      console.log('Teachers filtered:', teacherData);
      
      setClasses(classData);
      setSections(sectionData);
      setTeachers(teacherData);
      
      if (teacherData.length === 0) {
        console.warn('No teachers found! Make sure staff records have role="teacher"');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const assignmentData = await ClassTeacherAssignment.filter({ academic_year: academicYear });
      setAssignments(assignmentData);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleTeacherSelect = (classId, sectionId, teacherId) => {
    const key = `${classId}-${sectionId}`;
    setTeacherSelections(prev => ({ ...prev, [key]: teacherId }));
    setChangedKeys(prev => new Set([...prev, key]));
  };

  const handleSaveAll = async () => {
    if (changedKeys.size === 0) {
      alert('No changes to save');
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    let errorCount = 0;

    try {
      for (const key of changedKeys) {
        const [classId, sectionId] = key.split('-');
        const teacherId = teacherSelections[key];

        if (!teacherId) {
          console.log(`Skipping ${key} - no teacher selected`);
          continue;
        }

        const teacher = teachers.find(t => t.id === teacherId);
        const cls = classes.find(c => c.id === classId);
        const sec = sections.find(s => s.id === sectionId);

        if (!teacher || !cls || !sec) {
          console.error(`Missing data for key ${key}`);
          errorCount++;
          continue;
        }

        const existingAssignment = assignments.find(a => 
          a.class_id === classId && 
          a.section_id === sectionId &&
          a.academic_year === academicYear
        );

        const data = {
          class_id: classId,
          class_name: cls.name,
          section_id: sectionId,
          section_name: sec.name,
          teacher_id: teacherId,
          teacher_name: `${teacher.first_name} ${teacher.last_name}`,
          academic_year: academicYear,
        };

        try {
          if (existingAssignment) {
            await ClassTeacherAssignment.update(existingAssignment.id, data);
          } else {
            await ClassTeacherAssignment.create(data);
          }
          savedCount++;
        } catch (err) {
          console.error(`Error saving assignment for ${cls.name}-${sec.name}:`, err);
          errorCount++;
        }
      }

      alert(`✅ Success!\n\nSaved: ${savedCount} assignments\n${errorCount > 0 ? `Errors: ${errorCount}` : ''}`);
      setChangedKeys(new Set());
      loadAssignments();
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Error saving assignments: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getAssignedTeacherName = (classId, sectionId) => {
    const assignment = assignments.find(a => 
      a.class_id === classId && 
      a.section_id === sectionId &&
      a.academic_year === academicYear
    );
    return assignment ? assignment.teacher_name : 'Not Assigned';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assign Class Teacher</h1>
          <p className="text-gray-500">Assign class teachers to each class and section</p>
        </div>
      </div>

      {/* Info Alert */}
      {teachers.length === 0 && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Teachers Found</AlertTitle>
          <AlertDescription>
            No staff members with role="teacher" were found. Please add staff members with the "teacher" role in the Staff Directory page first.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Teacher Assignments
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Academic Year:
            </div>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select Year"/>
              </SelectTrigger>
              <SelectContent>
                {availableSessions.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}{s.is_current ? ' (Current)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading data...</div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{teachers.length}</strong> teachers available for assignment
                  {changedKeys.size > 0 && (
                    <> • <strong>{changedKeys.size}</strong> unsaved changes</>
                  )}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Current Assignment</TableHead>
                      <TableHead>Select Class Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSectionPairs.map(pair => {
                      const key = `${pair.class.id}-${pair.section.id}`;
                      const isChanged = changedKeys.has(key);
                      const currentTeacherName = getAssignedTeacherName(pair.class.id, pair.section.id);
                      
                      return (
                        <TableRow key={key} className={isChanged ? 'bg-yellow-50' : ''}>
                          <TableCell className="font-medium">{pair.class.name}</TableCell>
                          <TableCell>{pair.section.name}</TableCell>
                          <TableCell>
                            <Badge variant={currentTeacherName === 'Not Assigned' ? 'outline' : 'default'}>
                              {currentTeacherName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={teacherSelections[key] || ''}
                              onValueChange={teacherId => handleTeacherSelect(pair.class.id, pair.section.id, teacherId)}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select Teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.length === 0 ? (
                                  <div className="p-2 text-sm text-gray-500">No teachers available</div>
                                ) : (
                                  teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.first_name} {t.last_name} {t.designation ? `(${t.designation})` : ''}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Save All Button */}
              <div className="mt-6 flex justify-end gap-4 items-center border-t pt-4">
                {changedKeys.size > 0 && (
                  <p className="text-sm text-gray-600">
                    {changedKeys.size} unsaved change(s)
                  </p>
                )}
                <Button 
                  size="lg"
                  onClick={handleSaveAll}
                  disabled={isSaving || changedKeys.size === 0}
                  className="min-w-[200px]"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? 'Saving...' : `Save All Records`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Classes</div>
            <div className="text-2xl font-bold">{classSectionPairs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Assigned</div>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.academic_year === academicYear).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Unassigned</div>
            <div className="text-2xl font-bold text-orange-600">
              {classSectionPairs.length - assignments.filter(a => a.academic_year === academicYear).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Available Teachers</div>
            <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}