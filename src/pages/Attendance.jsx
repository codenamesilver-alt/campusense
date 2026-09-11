import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Attendance } from '@/entities/Attendance';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Calendar, Search, Save } from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '../components/auth/PermissionProvider';

export default function AttendancePage() {
  const { user } = usePermissions();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Loading dropdown data for attendance...');
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      console.log(`Loading students for attendance - Class: ${selectedClass}, Section: ${selectedSection}`);
      loadStudents();
    } else {
      setStudents([]);
      setAttendance({});
    }
  }, [selectedClass, selectedSection, selectedDate]);

  const loadDropdownData = async () => {
    try {
      console.log('Fetching classes and sections for attendance...');
      const classData = await Class.list('numeric_value');
      const sectionData = await Section.list('name');
      console.log('Attendance - Classes loaded:', classData.length);
      console.log('Attendance - Sections loaded:', sectionData.length);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Failed to load classes or sections for attendance:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading students for attendance: class=${selectedClass}, section=${selectedSection}, date=${selectedDate}`);
      
      // Changed to use Student.filter directly for efficiency
      const classStudents = await Student.filter({
        class: selectedClass,
        section: selectedSection,
        status: 'active' // Assuming only active students should be listed for attendance
      });
      
      console.log('Filtered students for attendance:', classStudents.length);
      setStudents(classStudents);

      // Load existing attendance for this date
      const existingAttendance = await Attendance.filter({ 
        date: selectedDate,
        class: selectedClass,
        section: selectedSection
      });
      
      console.log('Existing attendance records:', existingAttendance.length);

      // Initialize attendance state
      const attendanceState = {};
      classStudents.forEach(student => {
        const existingRecord = existingAttendance.find(a => a.student_id === student.id);
        attendanceState[student.id] = existingRecord ? existingRecord.status : 'present';
      });
      
      setAttendance(attendanceState);
    } catch (error) {
      console.error('Error loading students for attendance:', error);
      alert('Error loading students: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedSection || Object.keys(attendance).length === 0) {
      alert('Please select class, section and mark attendance first.');
      return;
    }

    setIsSaving(true);
    try {
      // Delete existing attendance for this date/class/section
      const existingAttendance = await Attendance.filter({ 
        date: selectedDate,
        class: selectedClass,
        section: selectedSection
      });

      for (const record of existingAttendance) {
        await Attendance.delete(record.id);
      }

      // Save new attendance records
      for (const [studentId, status] of Object.entries(attendance)) {
        await Attendance.create({
          student_id: studentId,
          date: selectedDate,
          class: selectedClass,
          section: selectedSection,
          status: status,
          marked_by: user?.email || 'system'
        });
      }

      alert(`Attendance saved for ${Object.keys(attendance).length} students on ${format(new Date(selectedDate), 'dd/MM/yyyy')}`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStats = () => {
    const total = Object.keys(attendance).length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const halfDay = Object.values(attendance).filter(status => status === 'half_day').length; // Added half_day stat
    return { total, present, absent, late, halfDay };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mark Daily Attendance</h1>
          <p className="text-gray-500">Record student attendance for the selected date</p>
        </div>
        {Object.keys(attendance).length > 0 && (
          <Button onClick={handleSaveAttendance} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Attendance
              </>
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class, Section & Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
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
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      {Object.keys(attendance).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4"> {/* Changed to 5 columns for Half Day */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          {/* Half Day Stat Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Half Day</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.halfDay}</p>
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {students.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Attendance List */}
      {selectedClass && selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Attendance - Class {selectedClass} Section {selectedSection}
              <span className="text-sm font-normal text-gray-500">
                ({format(new Date(selectedDate), 'dd/MM/yyyy')})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {students.length === 0 && selectedClass && selectedSection && !isLoading ? 'No students found in this class and section with "active" status.' : 
                 (students.length > 0 && searchTerm ? 'No students match your search.' : 'Select a class and section to view students.')}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Roll: {student.roll_number || '-'} | Admission: {student.admission_number}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {['present', 'absent', 'late', 'half_day'].map((status) => (
                        <Button
                          key={status}
                          variant={attendance[student.id] === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAttendanceChange(student.id, status)}
                          className={
                            attendance[student.id] === status 
                              ? status === 'present' ? 'bg-green-600 hover:bg-green-700' :
                                status === 'absent' ? 'bg-red-600 hover:bg-red-700' :
                                status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                'bg-purple-600 hover:bg-purple-700' // Half Day button color
                              : ''
                          }
                        >
                          {status === 'present' ? 'Present' :
                           status === 'absent' ? 'Absent' :
                           status === 'late' ? 'Late' : 'Half Day'}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClass || !selectedSection ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select class and section to mark attendance</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}