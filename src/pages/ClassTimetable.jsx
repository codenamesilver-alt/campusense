import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash, Edit, Clock, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClassTimetable() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [periodForm, setPeriodForm] = useState({
    period_number: '',
    start_time: '',
    end_time: ''
  });
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    loadInitialData();
    loadPeriods();
  }, []);
  
  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadTimetable();
    }
  }, [selectedClass, selectedSection]);

  const loadInitialData = async () => {
    try {
      const [classData, sectionData, subjectData, subjectGroupData, teacherData] = await Promise.all([
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.Subject.list('name'),
        base44.entities.SubjectGroup.list(),
        fetchAllFiltered('Staff', { role: 'teacher' })
      ]);
      
      setClasses(classData);
      setSections(sectionData);
      setSubjects(subjectData);
      setSubjectGroups(subjectGroupData);
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPeriods = async () => {
    try {
      // Try to load periods from a settings or configuration entity
      // For now, we'll use a simple array stored in state
      const storedPeriods = localStorage.getItem('school_periods');
      if (storedPeriods) {
        setPeriods(JSON.parse(storedPeriods));
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const savePeriods = (updatedPeriods) => {
    localStorage.setItem('school_periods', JSON.stringify(updatedPeriods));
    setPeriods(updatedPeriods);
  };

  const loadTimetable = async () => {
    try {
      const data = await fetchAllFiltered('Timetable', { 
        class_id: selectedClass, 
        section_id: selectedSection 
      });
      setTimetable(data);
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodForm({
      period_number: periods.length + 1,
      start_time: '',
      end_time: ''
    });
    setShowPeriodDialog(true);
  };

  const handleEditPeriod = (period, index) => {
    setEditingPeriod(index);
    setPeriodForm(period);
    setShowPeriodDialog(true);
  };

  const handleSavePeriod = () => {
    if (!periodForm.start_time || !periodForm.end_time) {
      alert('Please fill in all period details');
      return;
    }

    let updatedPeriods = [...periods];
    if (editingPeriod !== null) {
      updatedPeriods[editingPeriod] = periodForm;
    } else {
      updatedPeriods.push(periodForm);
    }

    savePeriods(updatedPeriods);
    setShowPeriodDialog(false);
    setPeriodForm({ period_number: '', start_time: '', end_time: '' });
  };

  const handleDeletePeriod = (index) => {
    if (window.confirm('Are you sure you want to delete this period?')) {
      const updatedPeriods = periods.filter((_, i) => i !== index);
      // Renumber periods
      const renumbered = updatedPeriods.map((p, i) => ({
        ...p,
        period_number: i + 1
      }));
      savePeriods(renumbered);
    }
  };

  const getPeriodsWithInterval = () => {
    const periodsWithInterval = [];
    periods.forEach((period, index) => {
      periodsWithInterval.push(period);
      // Add interval after 4th period
      if (index === 3 && periods.length > 4) {
        periodsWithInterval.push({
          period_number: 'INTERVAL',
          start_time: period.end_time,
          end_time: periods[4]?.start_time || '',
          isInterval: true
        });
      }
    });
    return periodsWithInterval;
  };

  const getSubjectsForClass = () => {
    const classObj = classes.find(c => c.id === selectedClass);
    if (!classObj) return [];

    // Find subject group for this class
    const subjectGroup = subjectGroups.find(sg => sg.class_name === classObj.name);
    if (!subjectGroup || !subjectGroup.subject_ids) return subjects;

    // Return subjects in this group
    return subjects.filter(s => subjectGroup.subject_ids.includes(s.id));
  };

  const generateTimetableWithAI = async () => {
    if (!selectedClass || !selectedSection) {
      alert('Please select class and section');
      return;
    }

    if (periods.length === 0) {
      alert('Please add periods first');
      return;
    }

    setIsGenerating(true);
    try {
      const classSubjects = getSubjectsForClass();
      const classObj = classes.find(c => c.id === selectedClass);
      const sectionObj = sections.find(s => s.id === selectedSection);

      const prompt = `You are an expert school timetable scheduler. Generate a smart, balanced weekly timetable for ${classObj.name} - ${sectionObj.name}.

Available subjects: ${classSubjects.map(s => s.name).join(', ')}
Number of periods per day: ${periods.length}
Days: Monday to Saturday

Requirements:
1. Distribute subjects evenly across the week
2. Important subjects (Math, Science, English) should appear in morning slots when possible
3. Physical Education/Sports should be in afternoon
4. No subject should repeat on the same day
5. Each subject should appear at least 2-3 times per week
6. Vary the timing - don't schedule same subject at same period every day

Return ONLY a valid JSON array with this exact structure (no additional text):
[
  {
    "day": "Monday",
    "period": 1,
    "subject": "Mathematics"
  },
  ...
]

Generate for all ${days.length} days and ${periods.length} periods per day.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            timetable: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  period: { type: "number" },
                  subject: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Delete existing timetable for this class/section
      const existingTimetable = await fetchAllFiltered('Timetable', { 
        class_id: selectedClass, 
        section_id: selectedSection 
      });
      
      for (const entry of existingTimetable) {
        await base44.entities.Timetable.delete(entry.id);
      }

      // Create new timetable entries
      const timetableData = response.timetable || [];
      for (const entry of timetableData) {
        const subject = classSubjects.find(s => s.name.toLowerCase() === entry.subject.toLowerCase());
        const period = periods.find(p => p.period_number === entry.period);
        const randomTeacher = teachers.length > 0 ? teachers[Math.floor(Math.random() * teachers.length)] : null;
        
        if (subject && period && randomTeacher) {
          // Assign a random teacher for now (can be edited later)
          
          await base44.entities.Timetable.create({
            class_id: selectedClass,
            section_id: selectedSection,
            day_of_week: entry.day,
            period_number: entry.period,
            start_time: period.start_time,
            end_time: period.end_time,
            subject_id: subject.id,
            teacher_id: randomTeacher.id
          });
        }
      }

      await loadTimetable();
      alert('Timetable generated successfully!');
    } catch (error) {
      console.error('Error generating timetable:', error);
      alert('Failed to generate timetable. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCellChange = async (day, period, field, value) => {
    const existingEntry = timetable.find(t => t.day_of_week === day && t.period_number === period.period_number);
    
    let data = existingEntry ? { ...existingEntry } : {
      class_id: selectedClass,
      section_id: selectedSection,
      day_of_week: day,
      period_number: period.period_number,
      start_time: period.start_time,
      end_time: period.end_time,
    };
    
    data[field] = value;

    try {
      if (data.subject_id && data.teacher_id) {
        if (existingEntry) {
          await base44.entities.Timetable.update(existingEntry.id, data);
        } else {
          await base44.entities.Timetable.create(data);
        }
        loadTimetable();
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const classSubjects = getSubjectsForClass();
  const periodsWithInterval = getPeriodsWithInterval();

  return (
    <div className="space-y-6">
      {/* Period Management */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manage School Periods
          </CardTitle>
          <Button onClick={handleAddPeriod}>
            <Plus className="mr-2 h-4 w-4" /> Add Period
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {periods.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No periods added yet. Click "Add Period" to start.</p>
            ) : (
              periods.map((period, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg">Period {period.period_number}</span>
                    <span className="text-gray-600">{period.start_time} - {period.end_time}</span>
                    {index === 3 && periods.length > 4 && (
                      <span className="ml-4 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        Interval after this period
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPeriod(period, index)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeletePeriod(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Period Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriod !== null ? 'Edit Period' : 'Add Period'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Period Number</Label>
              <Input 
                type="number" 
                value={periodForm.period_number} 
                onChange={(e) => setPeriodForm({...periodForm, period_number: parseInt(e.target.value)})}
                disabled={editingPeriod !== null}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input 
                type="time" 
                value={periodForm.start_time} 
                onChange={(e) => setPeriodForm({...periodForm, start_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input 
                type="time" 
                value={periodForm.end_time} 
                onChange={(e) => setPeriodForm({...periodForm, end_time: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePeriod}>Save Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timetable Generation */}
      {periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Class Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center mb-6">
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select onValueChange={setSelectedSection} disabled={!selectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button 
                onClick={generateTimetableWithAI}
                disabled={!selectedClass || !selectedSection || isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Auto Generate with AI
                  </>
                )}
              </Button>
            </div>

            {selectedClass && selectedSection && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day/Period</TableHead>
                      {periodsWithInterval.map((p, i) => (
                        <TableHead key={i} className={p.isInterval ? 'bg-orange-50' : ''}>
                          {p.isInterval ? (
                            <div className="text-center">
                              <div className="font-bold">INTERVAL</div>
                              <div className="text-xs font-normal">{p.start_time}-{p.end_time}</div>
                            </div>
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
                          
                          const entry = timetable.find(t => t.day_of_week === day && t.period_number === period.period_number);
                          return (
                            <TableCell key={idx}>
                              <div className="space-y-2">
                                <Select value={entry?.subject_id || ''} onValueChange={(v) => handleCellChange(day, period, 'subject_id', v)}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Subject"/>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={entry?.teacher_id || ''} onValueChange={(v) => handleCellChange(day, period, 'teacher_id', v)}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Teacher"/>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
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
      )}
    </div>
  );
}