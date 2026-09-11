import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval } from 'date-fns';

export default function StaffLeaveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leavesData, staffData, deptData] = await Promise.all([
        fetchAllFiltered('LeaveApplication', {
          applicant_type: 'staff',
          status: 'approved'
        }),
        fetchAllFiltered('Staff', { status: 'active' }),
        base44.entities.Department.list()
      ]);

      setLeaves(leavesData);
      setStaff(staffData);
      setDepartments(deptData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getStaffOnLeave = (date) => {
    let filteredLeaves = leaves.filter(leave => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    // Apply filters
    if (selectedDepartment !== 'all') {
      filteredLeaves = filteredLeaves.filter(leave => {
        const staffMember = staff.find(s => s.id === leave.applicant_id);
        return staffMember?.department === selectedDepartment;
      });
    }

    if (selectedStaff !== 'all') {
      filteredLeaves = filteredLeaves.filter(leave => leave.applicant_id === selectedStaff);
    }

    return filteredLeaves;
  };

  const filteredStaff = selectedDepartment === 'all' 
    ? staff 
    : staff.filter(s => s.department === selectedDepartment);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Leave Calendar</h1>
        <p className="text-gray-500">View approved leaves for all staff members</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {filteredStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} - {s.staff_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const staffOnLeave = getStaffOnLeave(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-2 border rounded-lg
                    ${isToday ? 'bg-blue-50 border-blue-500' : 'bg-white'}
                    ${staffOnLeave.length > 0 ? 'bg-red-50' : ''}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                    {staffOnLeave.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                        {staffOnLeave.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {staffOnLeave.slice(0, 3).map((leave, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-1 bg-orange-100 text-orange-800 rounded truncate"
                        title={leave.applicant_name}
                      >
                        {leave.applicant_name.split(' ')[0]}
                      </div>
                    ))}
                    {staffOnLeave.length > 3 && (
                      <p className="text-xs text-gray-500">+{staffOnLeave.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded"></div>
              <span className="text-sm">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border rounded"></div>
              <span className="text-sm">Staff on Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 rounded"></div>
              <span className="text-sm">Individual Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff on Leave Today */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff on Leave Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const todayLeaves = getStaffOnLeave(new Date());
            return todayLeaves.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No staff on leave today</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayLeaves.map(leave => {
                  const staffMember = staff.find(s => s.id === leave.applicant_id);
                  return (
                    <div key={leave.id} className="p-4 border rounded-lg">
                      <p className="font-medium">{leave.applicant_name}</p>
                      <p className="text-sm text-gray-500">{staffMember?.designation} • {staffMember?.department}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(leave.start_date), 'dd MMM')} - {format(new Date(leave.end_date), 'dd MMM')}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {leave.leave_type?.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}