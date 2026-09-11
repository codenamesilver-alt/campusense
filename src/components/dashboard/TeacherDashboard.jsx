import { useState, useEffect } from 'react';
import { Staff } from '@/entities/Staff';
import { ClassTeacherAssignment } from '@/entities/ClassTeacherAssignment';
import { Student } from '@/entities/Student';
import { Attendance } from '@/entities/Attendance';
import { ExamSchedule } from '@/entities/ExamSchedule';
import { Notice } from '@/entities/Notice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Bell, ClipboardList } from 'lucide-react';
import { usePermissions } from '../auth/PermissionProvider';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherDashboard() {
  const { user } = usePermissions();
  const [teacherData, setTeacherData] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [notices, setNotices] = useState([]);
  const [attendanceToMark, setAttendanceToMark] = useState([]);

  useEffect(() => {
    if (user) {
      loadTeacherData();
    }
  }, [user]);

  const loadTeacherData = async () => {
    try {
      // Find teacher record by email
      const teachers = await Staff.filter({ email: user.email });
      if (teachers.length > 0) {
        const teacher = teachers[0];
        setTeacherData(teacher);

        // Load teacher-specific data
        const [classes, schedule, teacherNotices] = await Promise.all([
          ClassTeacherAssignment.filter({ teacher_id: teacher.id }),
          ExamSchedule.filter({ 
            exam_date: new Date().toISOString().split('T')[0],
            invigilator: teacher.first_name + ' ' + teacher.last_name 
          }),
          Notice.filter({ 
            target_audience: ['all', 'staff'],
            status: 'published'
          }, '-created_date', 5)
        ]);

        setAssignedClasses(classes);
        setTodaySchedule(schedule);
        setNotices(teacherNotices);

        // Count total students in assigned classes
        let studentCount = 0;
        for (const classAssignment of classes) {
          const students = await Student.filter({ 
            class: classAssignment.class_name,
            section: classAssignment.section_name,
            status: 'active'
          });
          studentCount += students.length;
          
          // Check if attendance is marked for today
          const today = new Date().toISOString().split('T')[0];
          const todayAttendance = await Attendance.filter({
            class: classAssignment.class_name,
            section: classAssignment.section_name,
            date: today
          });
          
          if (todayAttendance.length === 0) {
            setAttendanceToMark(prev => [...prev, {
              class: classAssignment.class_name,
              section: classAssignment.section_name,
              studentCount: students.length
            }]);
          }
        }
        setTotalStudents(studentCount);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  if (!teacherData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Loading your dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {teacherData.first_name} {teacherData.last_name}!</h1>
        <p className="text-gray-500">{teacherData.designation} • {teacherData.department}</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned Classes</p>
                <p className="text-2xl font-bold">{assignedClasses.length}</p>
                <p className="text-xs text-gray-500">Class teacher</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-gray-500">Under your care</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Schedule</p>
                <p className="text-2xl font-bold">{todaySchedule.length}</p>
                <p className="text-xs text-gray-500">Exam duties</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Attendance</p>
                <p className="text-2xl font-bold">{attendanceToMark.length}</p>
                <p className="text-xs text-gray-500">Classes pending</p>
              </div>
              <ClipboardList className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes assigned</p>
            ) : (
              <div className="space-y-3">
                {assignedClasses.map((classAssignment) => (
                  <div key={classAssignment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Class {classAssignment.class_name}-{classAssignment.section_name}</p>
                      <p className="text-sm text-gray-500">Class Teacher</p>
                    </div>
                    <Link to={createPageUrl('StudentDetails')}>
                      <Button variant="outline" size="sm">View Students</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance to Mark */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Attendance Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceToMark.length === 0 ? (
              <div className="text-center py-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  All attendance marked for today!
                </Badge>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceToMark.map((classInfo, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">Class {classInfo.class}-{classInfo.section}</p>
                      <p className="text-sm text-gray-500">{classInfo.studentCount} students</p>
                    </div>
                    <Link to={createPageUrl('Attendance')}>
                      <Button size="sm">Mark Attendance</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      {todaySchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Exam Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.map((exam) => (
                <div key={exam.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{exam.subject_name}</p>
                  <p className="text-sm text-gray-500">Class {exam.class}-{exam.section}</p>
                  <p className="text-sm text-gray-500">{exam.start_time} - {exam.end_time}</p>
                  <p className="text-sm text-gray-500">Room: {exam.room_no || 'TBA'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Notices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent notices</p>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">{notice.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notice.publish_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}