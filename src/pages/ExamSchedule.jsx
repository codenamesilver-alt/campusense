import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash } from 'lucide-react';
import ClassMultiSelect from '@/components/exam/ClassMultiSelect';

export default function ExamSchedule() {
  const [examGroups, setExamGroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [maxMarks, setMaxMarks] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [groups, scheds, classData, sectionData, subjData, sgData] = await Promise.all([
        base44.entities.ExamGroup.list(),
        base44.entities.ExamSchedule.list('-created_date'),
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.Subject.list(),
        base44.entities.SubjectGroup.list()
      ]);
      setExamGroups(groups);
      setSchedules(scheds);
      setClasses(classData);
      setSections(sectionData);
      setSubjects(subjData);
      setSubjectGroups(sgData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getSubjectsForClass = (className) => {
    const cls = classes.find(c => c.name === className);
    if (!cls) return [];
    const groups = subjectGroups.filter(sg => sg.class_name === cls.name);
    const subjectIds = [...new Set(groups.flatMap(g => g.subject_ids || []))];
    return subjectIds
      .map(sid => subjects.find(s => String(s.id) === String(sid))?.name)
      .filter(Boolean);
  };

  const handleAdd = async () => {
    if (!selectedGroup || selectedClasses.length === 0 || !maxMarks) {
      alert('Please select an Exam Group, at least one Class, and enter Max Marks.');
      return;
    }

    const group = examGroups.find(g => g.id === selectedGroup);
    const existingKeys = new Set(
      schedules.map(s => `${s.exam_group_id}|${s.class}|${s.subject_name}`)
    );

    const records = [];
    const skipped = [];
    selectedClasses.forEach(className => {
      const subjNames = getSubjectsForClass(className);
      if (subjNames.length === 0) {
        skipped.push(className);
        return;
      }
      subjNames.forEach(subjName => {
        const key = `${selectedGroup}|${className}|${subjName}`;
        if (existingKeys.has(key)) return;
        records.push({
          exam_group_id: selectedGroup,
          class: className,
          section: selectedSection,
          subject_name: subjName,
          max_marks: Number(maxMarks),
          academic_session: group?.academic_session || ''
        });
      });
    });

    if (skipped.length > 0 && records.length === 0) {
      alert(`No subjects mapped for the selected class(es): ${skipped.join(', ')}. Please map subjects to classes via Subject Group first.`);
      return;
    }

    if (records.length === 0) {
      alert('Marks configuration already exists for the selected class(es) and subjects.');
      return;
    }

    try {
      await base44.entities.ExamSchedule.bulkCreate(records);
      setMaxMarks('');
      loadAll();
    } catch (error) {
      console.error('Failed to save marks configuration:', error);
      alert('Failed to save marks configuration.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this marks configuration entry?')) {
      try {
        await base44.entities.ExamSchedule.delete(id);
        loadAll();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const filtered = schedules.filter(s =>
    (!selectedGroup || s.exam_group_id === selectedGroup) &&
    (selectedClasses.length === 0 || selectedClasses.includes(s.class)) &&
    (selectedSection === 'All Sections' || s.section === selectedSection)
  );

  const groupName = (id) => examGroups.find(g => g.id === id)?.name || '-';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exam Marks Configuration</h1>
        <p className="text-muted-foreground">Set max marks for an exam group across selected classes. All subjects in each class share the same max marks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Filters & Configure Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Exam Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam Group" />
                </SelectTrigger>
                <SelectContent>
                  {examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Classes (multiple)</Label>
              <ClassMultiSelect
                classes={classes}
                selected={selectedClasses}
                onChange={setSelectedClasses}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Sections">All Sections</SelectItem>
                  {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold">Set Max Marks</h3>
            <p className="text-sm text-muted-foreground">This max marks will apply to all subjects of the selected class(es).</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="max_marks">Max Marks <span className="text-destructive">*</span></Label>
                <Input
                  id="max_marks"
                  value={maxMarks}
                  onChange={e => setMaxMarks(e.target.value)}
                  placeholder="Max Marks"
                  type="number"
                  min="0"
                />
              </div>
              <Button onClick={handleAdd} className="sm:col-span-2">
                <Plus className="mr-2 h-4 w-4" /> Apply to All Subjects
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Group</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No marks configured yet.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{groupName(item.exam_group_id)}</TableCell>
                  <TableCell className="font-medium">{item.class}</TableCell>
                  <TableCell>{item.section}</TableCell>
                  <TableCell>{item.subject_name}</TableCell>
                  <TableCell>{item.max_marks}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}