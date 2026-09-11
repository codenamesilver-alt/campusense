import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Attendance } from '@/entities/Attendance';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function StudentAttendanceReport() {
  const [reportData, setReportData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    type: 'monthly',
    class: '',
    section: '',
    month: format(new Date(), 'yyyy-MM'),
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    (async () => {
      setClasses(await Class.list());
      setSections(await Section.list());
    })();
  }, []);

  const handleGenerateReport = async () => {
    const { type, class: selectedClass, section, month, dateFrom, dateTo } = filters;
    if (!selectedClass || !section) {
      alert("Please select class and section.");
      return;
    }
    if ((type === 'date_range' && (!dateFrom || !dateTo))) {
        alert("Please select a date range.");
        return;
    }
    
    setIsLoading(true);
    
    let startDate, endDate;
    if (type === 'monthly') {
        startDate = startOfMonth(new Date(month));
        endDate = endOfMonth(new Date(month));
    } else {
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
    }
    
    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });

    try {
        const [studentData, attendanceData] = await Promise.all([
            Student.filter({ class: selectedClass, section: section, status: 'active' }),
            Attendance.list() // Ideally, filter by date range on the backend
        ]);

        const attendanceMap = new Map();
        attendanceData.forEach(att => {
            const key = `${att.student_id}_${att.date}`;
            attendanceMap.set(key, att.status.charAt(0).toUpperCase());
        });

        const studentReports = studentData.map(student => {
            let present = 0, absent = 0, late = 0, half_day = 0, on_leave = 0, working_days = 0;
            const dailyStatuses = {};

            daysInterval.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayKey = format(day, 'dd');
                const status = attendanceMap.get(`${student.id}_${dateStr}`);

                if (status) {
                    working_days++;
                    dailyStatuses[dayKey] = status;
                    if (status === 'P') present++;
                    else if (status === 'A') absent++;
                    else if (status === 'L') late++;
                    else if (status === 'H') half_day++;
                    else if (status === 'O') on_leave++;
                } else {
                    dailyStatuses[dayKey] = '-';
                }
            });

            const attendedDays = present + late + half_day + on_leave;
            const percentage = working_days > 0 ? ((attendedDays / working_days) * 100).toFixed(1) : '0.0';

            return {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                roll: student.roll_number,
                ...dailyStatuses,
                present: attendedDays,
                absent,
                percentage
            };
        });

        setReportData({ days: daysInterval, students: studentReports });
    } catch (error) {
        console.error('Error generating report:', error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleExport = (formatType) => {
    const { days, students } = reportData;
    const dayHeaders = days.map(d => ({ key: format(d, 'dd'), label: format(d, 'dd')}));
    
    const headers = [
        { key: 'roll', label: 'Roll' },
        { key: 'name', label: 'Name' },
        ...dayHeaders,
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'percentage', label: 'Percentage (%)' }
    ];

    if (formatType === 'csv') {
      exportToCsv(students, headers, 'student_attendance_report.csv');
    } else {
      exportToPdf(students, headers, 'Student Attendance Report', 'student_attendance_report.pdf');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Attendance Report</CardTitle>
        <CardDescription>Generate daily, monthly, or date-range attendance reports for any class.</CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
            <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={filters.type} onValueChange={v => setFilters(f => ({...f, type: v}))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="date_range">Date Range</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Class</Label>
                <Select value={filters.class} onValueChange={v => setFilters(f => ({...f, class: v}))}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Section</Label>
                <Select value={filters.section} onValueChange={v => setFilters(f => ({...f, section: v}))}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            {filters.type === 'monthly' ? (
                <div className="space-y-2">
                    <Label>Month</Label>
                    <Input type="month" value={filters.month} onChange={e => setFilters(f => ({...f, month: e.target.value}))}/>
                </div>
            ) : (
                <>
                <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))}/>
                </div>
                <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))}/>
                </div>
                </>
            )}
            <Button onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Generate
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={!reportData.students || reportData.students.length === 0}>
                <FileText className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!reportData.students || reportData.students.length === 0}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead>
                <TableHead>Name</TableHead>
                {reportData.days?.map(day => <TableHead key={format(day, 'dd')} className="text-center">{format(day, 'dd')}</TableHead>)}
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={100} className="text-center">Loading...</TableCell></TableRow>
              ) : reportData.students?.length > 0 ? (
                reportData.students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.roll}</TableCell>
                    <TableCell className="whitespace-nowrap">{student.name}</TableCell>
                    {reportData.days.map(day => <TableCell key={`${student.id}-${format(day, 'dd')}`} className="text-center">{student[format(day, 'dd')] || '-'}</TableCell>)}
                    <TableCell className="text-center">{student.present}</TableCell>
                    <TableCell className="text-center">{student.absent}</TableCell>
                    <TableCell className="text-center font-medium">{student.percentage}%</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={100} className="text-center py-8">No data found for the selected criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}