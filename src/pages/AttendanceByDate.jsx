import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Attendance as AttendanceEntity } from '@/entities/Attendance';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function AttendanceByDate() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    (async () => {
      setClasses(await Class.list());
      setSections(await Section.list());
    })();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedClass || !selectedSection || !selectedMonth) {
      alert("Please select class, section, and month.");
      return;
    }

    const [studentData, attendanceData] = await Promise.all([
      Student.filter({ class: selectedClass, section: selectedSection, status: 'active' }),
      AttendanceEntity.list() // In a real app, you'd filter this by month/class on the backend
    ]);
    
    setStudents(studentData);
    setAttendance(attendanceData);

    const monthStart = startOfMonth(new Date(selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedMonth));
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const studentReports = studentData.map(student => {
      let present = 0, absent = 0, late = 0, half_day = 0, on_leave = 0, total_days = 0;
      
      const dailyStatuses = {};
      daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const record = attendanceData.find(a => a.student_id === student.id && a.date === dateStr);
        if (record) {
          total_days++;
          switch (record.status) {
            case 'present': present++; break;
            case 'absent': absent++; break;
            case 'late': late++; break;
            case 'half_day': half_day++; break;
            case 'on_leave': on_leave++; break;
          }
          dailyStatuses[format(day, 'dd')] = record.status.charAt(0).toUpperCase();
        } else {
            dailyStatuses[format(day, 'dd')] = '-';
        }
      });

      const attendancePercentage = total_days > 0 ? ((present + late + half_day + on_leave) / total_days) * 100 : 0;
      
      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        roll: student.roll_number,
        present, absent, late, half_day, on_leave,
        percentage: attendancePercentage.toFixed(2),
        dailyStatuses,
      };
    });
    setReportData(studentReports);
  };
  
  const daysInMonth = selectedMonth ? eachDayOfInterval({ start: startOfMonth(new Date(selectedMonth)), end: endOfMonth(new Date(selectedMonth)) }) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Generate Monthly Attendance Report</CardTitle></CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Select onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
          <Select onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          <Button onClick={handleGenerateReport}><FileText className="mr-2 h-4 w-4" /> Generate Report</Button>
        </CardContent>
      </Card>
      
      {reportData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Report for {selectedClass} {selectedSection} - {format(new Date(selectedMonth), 'MMMM yyyy')}</CardTitle>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Name</TableHead>
                  {daysInMonth.map(day => <TableHead key={format(day, 'dd')} className="text-center">{format(day, 'dd')}</TableHead>)}
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">A</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.roll}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    {Object.values(row.dailyStatuses).map((status, i) => <TableCell key={i} className="text-center">{status}</TableCell>)}
                    <TableCell className="text-center">{row.present}</TableCell>
                    <TableCell className="text-center">{row.absent}</TableCell>
                    <TableCell className="text-center">{row.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}