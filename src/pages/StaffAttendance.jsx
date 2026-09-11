import { useState, useEffect } from 'react';
import { Staff } from '@/entities/Staff';
import { StaffAttendance } from '@/entities/StaffAttendance';
import { Department } from '@/entities/Department';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function StaffAttendancePage() {
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setDepartments(await Department.list());
    })();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchStaffAndAttendance();
    }
  }, [selectedDept, attendanceDate]);

  const fetchStaffAndAttendance = async () => {
    setIsLoading(true);
    try {
      const staffInDept = await Staff.filter({ department: selectedDept, status: 'active' });
      setStaffList(staffInDept);

      const existingAttendance = await StaffAttendance.filter({
        date: attendanceDate,
        staff_id: { '$in': staffInDept.map(s => s.id) }
      });
      
      const newAttendanceState = {};
      staffInDept.forEach(staff => {
        const record = existingAttendance.find(a => a.staff_id === staff.id);
        newAttendanceState[staff.id] = record ? record.status : 'present';
      });
      setAttendance(newAttendanceState);

    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (staffId, status) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const recordsToUpsert = staffList.map(staff => ({
        filter: { staff_id: staff.id, date: attendanceDate },
        update: {
          staff_id: staff.id,
          date: attendanceDate,
          status: attendance[staff.id]
        }
      }));
      
      // Since there's no bulk upsert, we'll do it one by one.
      // In a real app, a backend function for this would be better.
      for (const record of recordsToUpsert) {
         const existing = await StaffAttendance.filter(record.filter);
         if (existing.length > 0) {
            await StaffAttendance.update(existing[0].id, record.update);
         } else {
            await StaffAttendance.create(record.update);
         }
      }

      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error("Failed to submit attendance:", error);
      alert('Error submitting attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mark Staff Attendance</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Department & Date</CardTitle>
            {staffList.length > 0 && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Select onValueChange={setSelectedDept}>
              <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
              <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="p-2 border rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan="3" className="text-center">Loading staff...</TableCell></TableRow>
              ) : staffList.length > 0 ? (
                staffList.map(staff => (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.first_name} {staff.last_name}</TableCell>
                    <TableCell>{staff.staff_id}</TableCell>
                    <TableCell>
                      <RadioGroup
                        value={attendance[staff.id] || 'present'}
                        onValueChange={(status) => handleAttendanceChange(staff.id, status)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="present" id={`present-${staff.id}`} />
                          <Label htmlFor={`present-${staff.id}`}>Present</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id={`absent-${staff.id}`} />
                          <Label htmlFor={`absent-${staff.id}`}>Absent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="half_day" id={`half_day-${staff.id}`} />
                          <Label htmlFor={`half_day-${staff.id}`}>Half Day</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on_leave" id={`on_leave-${staff.id}`} />
                          <Label htmlFor={`on_leave-${staff.id}`}>On Leave</Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan="3" className="text-center">Select a department to see staff.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}