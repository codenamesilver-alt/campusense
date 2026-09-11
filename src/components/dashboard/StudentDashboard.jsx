import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeeDue } from '@/entities/FeeDue';
import { Attendance } from '@/entities/Attendance';
import { BookIssue } from '@/entities/BookIssue';
import { Notice } from '@/entities/Notice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, DollarSign, Calendar, BookOpen, Bell } from 'lucide-react';
import { usePermissions } from '../auth/PermissionProvider';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = usePermissions();
  const [studentData, setStudentData] = useState(null);
  const [feesDue, setFeesDue] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    try {
      // Find student record by email
      const students = await Student.filter({ guardian_email: user.email });
      if (students.length > 0) {
        const student = students[0];
        setStudentData(student);

        // Load student-specific data
        const [dues, attendance, books, studentNotices] = await Promise.all([
          FeeDue.filter({ student_id: student.id, status: 'pending' }),
          Attendance.filter({ student_id: student.id }),
          BookIssue.filter({ borrower_id: student.id, status: 'issued' }),
          Notice.filter({ 
            target_audience: ['all', 'students', 'specific_class'],
            specific_class: student.class,
            status: 'published'
          }, '-created_date', 5)
        ]);

        setFeesDue(dues);
        setIssuedBooks(books);
        setNotices(studentNotices);

        // Calculate attendance stats
        const presentDays = attendance.filter(a => a.status === 'present').length;
        setAttendanceStats({ present: presentDays, total: attendance.length });
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  if (!studentData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendancePercentage = attendanceStats.total > 0 
    ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1) 
    : 0;

  const totalFeesDue = feesDue.reduce((sum, fee) => sum + fee.balance_amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {studentData.first_name}!</h1>
        <p className="text-gray-500">Class {studentData.class}-{studentData.section} • Roll No: {studentData.roll_number}</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Attendance</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
                <p className="text-xs text-gray-500">{attendanceStats.present}/{attendanceStats.total} days</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Fees Due</p>
                <p className="text-2xl font-bold">₹{totalFeesDue}</p>
                <p className="text-xs text-gray-500">{feesDue.length} pending</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Books Issued</p>
                <p className="text-2xl font-bold">{issuedBooks.length}</p>
                <p className="text-xs text-gray-500">Return on time</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">House</p>
                <p className="text-2xl font-bold">{studentData.house || 'None'}</p>
                <p className="text-xs text-gray-500">Your house</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pending Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feesDue.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending fees</p>
            ) : (
              <div className="space-y-3">
                {feesDue.slice(0, 3).map((fee) => (
                  <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{fee.fee_head_name}</p>
                      <p className="text-sm text-gray-500">Due: {format(new Date(fee.due_date), 'MMM dd, yyyy')}</p>
                    </div>
                    <Badge variant="destructive">₹{fee.balance_amount}</Badge>
                  </div>
                ))}
                {feesDue.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">+{feesDue.length - 3} more fees due</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

      {/* Issued Books */}
      {issuedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Books Currently Issued to You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issuedBooks.map((book) => (
                <div key={book.id} className="p-3 border rounded-lg">
                  <p className="font-medium">Book ID: {book.book_id}</p>
                  <p className="text-sm text-gray-500">Issued: {format(new Date(book.issue_date), 'MMM dd')}</p>
                  <p className="text-sm text-gray-500">Due: {format(new Date(book.due_date), 'MMM dd')}</p>
                  {new Date(book.due_date) < new Date() && (
                    <Badge variant="destructive" className="mt-2">Overdue</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}