import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeachersTimetable() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherTimetable, setTeacherTimetable] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    loadInitialData();
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      loadTimetable();
    }
  }, [selectedTeacher]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [teacherData, subjectData, classData, sectionData] = await Promise.all([
        base44.entities.Staff.filter({ role: 'teacher' }),
        base44.entities.Subject.list(),
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name')
      ]);
      
      setTeachers(teacherData);
      setSubjects(subjectData);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPeriods = async () => {
    try {
      const storedPeriods = localStorage.getItem('school_periods');
      if (storedPeriods) {
        setPeriods(JSON.parse(storedPeriods));
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadTimetable = async () => {
    try {
      const data = await fetchAllFiltered('Timetable', { teacher_id: selectedTeacher });
      setTeacherTimetable(data);
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
  };
  
  const getSubjectName = id => subjects.find(s => s.id === id)?.name || '';
  const getClassName = id => classes.find(c => c.id === id)?.name || '';
  const getSectionName = id => sections.find(s => s.id === id)?.name || '';

  const getPeriodsWithInterval = () => {
    const periodsWithInterval = [];
    periods.forEach((period, index) => {
      periodsWithInterval.push(period);
      if (index === 3 && periods.length > 4) {
        periodsWithInterval.push({
          period_number: 'INTERVAL',
          isInterval: true
        });
      }
    });
    return periodsWithInterval;
  };

  const periodsWithInterval = getPeriodsWithInterval();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Teacher's Timetable</CardTitle>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No teachers found</div>
              ) : (
                teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} {t.designation ? `(${t.designation})` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !selectedTeacher ? (
            <div className="text-center py-8 text-gray-500">
              Please select a teacher to view their timetable
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No periods configured. Please configure periods in Class Timetable page first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day/Period</TableHead>
                    {periodsWithInterval.map((p, i) => (
                      <TableHead key={i} className={p.isInterval ? 'bg-orange-50' : ''}>
                        {p.isInterval ? (
                          <div className="text-center font-bold">INTERVAL</div>
                        ) : (
                          <div className="text-center">
                            <div>Period {p.period_number}</div>
                            <div className="text-xs font-normal">{p.start_time}-{p.end_time}</div>
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {days.map(day => (
                    <TableRow key={day}>
                      <TableHead className="font-bold">{day}</TableHead>
                      {periodsWithInterval.map((period, idx) => {
                        if (period.isInterval) {
                          return (
                            <TableCell key={idx} className="bg-orange-50 text-center">
                              <span className="text-orange-600 font-medium">Break</span>
                            </TableCell>
                          );
                        }

                        const entry = teacherTimetable.find(t => t.day_of_week === day && t.period_number === period.period_number);
                        return (
                          <TableCell key={idx}>
                            {entry ? (
                              <div className="text-sm">
                                <p className="font-bold">{getClassName(entry.class_id)} - {getSectionName(entry.section_id)}</p>
                                <p className="text-gray-600">{getSubjectName(entry.subject_id)}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}