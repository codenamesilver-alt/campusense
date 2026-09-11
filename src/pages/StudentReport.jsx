import { useState } from 'react';
import { Student } from '@/entities/Student';
import { Staff } from '@/entities/Staff';
import { Attendance as StudentAttendance } from '@/entities/Attendance';
import { StaffAttendance } from '@/entities/StaffAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const [admissionDates, setAdmissionDates] = useState({ start: '', end: '' });
  const [attendanceMonth, setAttendanceMonth] = useState(format(new Date(), 'yyyy-MM'));

  // --- REPORT GENERATION LOGIC ---

  const generateAllStudentReport = async (formatType) => {
    const students = await Student.list();
    const data = students.map(s => ({
      "Admission No": s.admission_number,
      "Name": `${s.first_name} ${s.last_name}`,
      "Class": s.class,
      "Section": s.section,
      "Phone": s.guardian_phone
    }));
    exportFile(data, `all_students_report`, formatType);
  };
  
  const generateNewAdmissionReport = async (formatType) => {
    if(!admissionDates.start || !admissionDates.end) {
        alert("Please select start and end dates for the admission report.");
        return;
    }
    const students = await Student.filter({
      admission_date: { '$gte': admissionDates.start, '$lte': admissionDates.end }
    });
    const data = students.map(s => ({
      "Admission Date": s.admission_date,
      "Name": `${s.first_name} ${s.last_name}`,
      "Class": s.class,
      "Phone": s.guardian_phone
    }));
    exportFile(data, `new_admissions_${admissionDates.start}_to_${admissionDates.end}`, formatType);
  };

  const generateStudentAttendanceReport = async (formatType) => {
    const students = await Student.list();
    const attendanceRecords = await StudentAttendance.list(); // In a real app, filter by month on backend
    const monthStart = startOfMonth(new Date(attendanceMonth));
    const monthEnd = endOfMonth(new Date(attendanceMonth));
    
    const data = students.map(student => {
        const studentRecords = attendanceRecords.filter(a => a.student_id === student.id && new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd);
        const presentDays = studentRecords.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'half_day').length;
        const totalDays = studentRecords.length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 'N/A';
        return {
            "Student Name": `${student.first_name} ${student.last_name}`,
            "Class": `${student.class}-${student.section}`,
            "Month": format(monthStart, 'MMMM yyyy'),
            "Attendance %": percentage,
        };
    });
    exportFile(data, `student_attendance_report_${format(monthStart, 'MMM_yyyy')}`, formatType);
  };

  const generateStaffAttendanceReport = async (formatType) => {
    const staff = await Staff.list();
    const attendanceRecords = await StaffAttendance.list(); // Filter on backend
    const monthStart = startOfMonth(new Date(attendanceMonth));
    const monthEnd = endOfMonth(new Date(attendanceMonth));

    const data = staff.map(s => {
        const staffRecords = attendanceRecords.filter(a => a.staff_id === s.id && new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd);
        const presentDays = staffRecords.filter(a => a.status === 'present' || a.status === 'half_day').length;
        const totalDays = staffRecords.length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 'N/A';
        return {
            "Staff Name": `${s.first_name} ${s.last_name}`,
            "Department": s.department,
            "Month": format(monthStart, 'MMMM yyyy'),
            "Attendance %": percentage,
        };
    });
    exportFile(data, `staff_attendance_report_${format(monthStart, 'MMM_yyyy')}`, formatType);
  };

  // --- UTILITY FOR EXPORT ---

  const exportFile = (data, filename, type) => {
    if (type === 'csv') {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
      ].join('\n');
      downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    } else if (type === 'pdf') {
      const headers = Object.keys(data[0]);
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <html>
          <head><title>${filename}</title><style>body{font-family:sans-serif;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;}th{background-color:#f2f2f2;}</style></head>
          <body>
            <h1>${filename.replace(/_/g, ' ')}</h1>
            <table>
              <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </body>
        </html>`;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold">Generate Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader><CardTitle>All Student Report</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p>Export a complete list of all students currently enrolled.</p>
                    <div className="flex gap-2">
                        <Button onClick={() => generateAllStudentReport('csv')}><FileDown className="mr-2 h-4"/> CSV</Button>
                        <Button onClick={() => generateAllStudentReport('pdf')}><FileDown className="mr-2 h-4"/> PDF</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>New Admission Report</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div><Label>Start Date</Label><Input type="date" value={admissionDates.start} onChange={e => setAdmissionDates({...admissionDates, start: e.target.value})}/></div>
                        <div><Label>End Date</Label><Input type="date" value={admissionDates.end} onChange={e => setAdmissionDates({...admissionDates, end: e.target.value})}/></div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => generateNewAdmissionReport('csv')}><FileDown className="mr-2 h-4"/> CSV</Button>
                        <Button onClick={() => generateNewAdmissionReport('pdf')}><FileDown className="mr-2 h-4"/> PDF</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Attendance Reports</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Select Month</Label>
                        <Input type="month" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)}/>
                    </div>
                    <div>
                        <p className="font-medium mb-2">Student Attendance</p>
                        <div className="flex gap-2">
                            <Button onClick={() => generateStudentAttendanceReport('csv')}><FileDown className="mr-2 h-4"/> CSV</Button>
                            <Button onClick={() => generateStudentAttendanceReport('pdf')}><FileDown className="mr-2 h-4"/> PDF</Button>
                        </div>
                    </div>
                     <div>
                        <p className="font-medium mb-2">Staff Attendance</p>
                        <div className="flex gap-2">
                            <Button onClick={() => generateStaffAttendanceReport('csv')}><FileDown className="mr-2 h-4"/> CSV</Button>
                            <Button onClick={() => generateStaffAttendanceReport('pdf')}><FileDown className="mr-2 h-4"/> PDF</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}