import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { ExamResult } from '@/entities/ExamResult';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp } from 'lucide-react';

export default function PromoteStudent() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [fromSection, setFromSection] = useState('');
  const [promotionData, setPromotionData] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    (async () => {
      const [classData, sectionData, resultData, sessionData] = await Promise.all([
        Class.list('numeric_value'),
        Section.list('name'),
        ExamResult.list(),
        base44.entities.Session.list()
      ]);
      setClasses(classData);
      setSections(sectionData);
      setResults(resultData);
      setSessions(sessionData);
      // Auto-select current session as fromSession and next as toSession
      const current = sessionData.find(s => s.is_current) || sessionData[0];
      if (current) {
        setFromSession(current.name);
        // Pick the next session if available, otherwise same
        const others = sessionData.filter(s => s.id !== current.id);
        setToSession(others.length > 0 ? others[0].name : current.name);
      }
    })();
  }, []);

  useEffect(() => {
    if (fromClass && fromSection) {
      loadStudents();
    }
  }, [fromClass, fromSection]);

  const loadStudents = async () => {
    const studentData = await Student.filter({ class: fromClass, section: fromSection, status: 'active' });
    setStudents(studentData);
    
    // Auto-populate promotion data
    const initialPromotionData = {};
    const fromClassObj = classes.find(c => c.name === fromClass);
    const toClassObj = classes.find(c => c.numeric_value === (fromClassObj?.numeric_value || 0) + 1);

    studentData.forEach(student => {
      // Simplified pass/fail logic. In reality, this would be complex.
      const studentResults = results.filter(r => r.student_id === student.id);
      const isPassed = studentResults.length > 0; // Dummy logic
      
      initialPromotionData[student.id] = {
        result: isPassed ? 'Pass' : 'Fail',
        toClass: isPassed && toClassObj ? toClassObj.name : fromClass,
        toSection: fromSection
      };
    });
    setPromotionData(initialPromotionData);
    setSelectedStudents(studentData.map(s => s.id)); // Select all by default
  };
  
  const handlePromotionDataChange = (studentId, field, value) => {
    setPromotionData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };
  
  const handleStudentSelect = (studentId) => {
      setSelectedStudents(prev => 
        prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
      );
  };
  
  const handlePromote = async () => {
      if (selectedStudents.length === 0) {
          alert("No students selected for promotion.");
          return;
      }
      if(!window.confirm(`Are you sure you want to promote/update ${selectedStudents.length} students? This action cannot be undone.`)) {
          return;
      }

      const updates = [];
      for (const studentId of selectedStudents) {
          const promoInfo = promotionData[studentId];
          updates.push(Student.update(studentId, {
              class: promoInfo.toClass,
              section: promoInfo.toSection,
              // You might also want to update the student's academic session field if it exists
          }));
      }

      try {
          await Promise.all(updates);
          alert("Students promoted successfully!");
          loadStudents(); // Refresh list
      } catch(error) {
          console.error("Promotion failed:", error);
          alert("An error occurred during promotion.");
      }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Promote Students</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select value={fromSession} onValueChange={setFromSession}>
            <SelectTrigger><SelectValue placeholder="From Session"/></SelectTrigger>
            <SelectContent>
              {sessions.map(s => <SelectItem key={s.id} value={s.name}>From: {s.name}{s.is_current ? ' (Current)' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={toSession} onValueChange={setToSession}>
            <SelectTrigger><SelectValue placeholder="To Session"/></SelectTrigger>
            <SelectContent>
              {sessions.map(s => <SelectItem key={s.id} value={s.name}>To: {s.name}{s.is_current ? ' (Current)' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setFromClass}><SelectTrigger><SelectValue placeholder="Select Current Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
          <Select onValueChange={setFromSection}><SelectTrigger><SelectValue placeholder="Select Current Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select>
        </CardContent>
      </Card>
      
      {students.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Students for Promotion</CardTitle>
              <Button onClick={handlePromote}><ArrowUp className="mr-2 h-4 w-4"/> Promote Selected Students</Button>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead><Checkbox onCheckedChange={(checked) => setSelectedStudents(checked ? students.map(s => s.id) : [])} checked={selectedStudents.length === students.length && students.length > 0}/></TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Promote to Class</TableHead>
                          <TableHead>Promote to Section</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {students.map(student => (
                          <TableRow key={student.id}>
                              <TableCell><Checkbox onCheckedChange={() => handleStudentSelect(student.id)} checked={selectedStudents.includes(student.id)}/></TableCell>
                              <TableCell>{student.first_name} {student.last_name}</TableCell>
                              <TableCell>
                                  <Select value={promotionData[student.id]?.result} onValueChange={(val) => handlePromotionDataChange(student.id, 'result', val)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent><SelectItem value="Pass">Pass</SelectItem><SelectItem value="Fail">Fail</SelectItem></SelectContent>
                                  </Select>
                              </TableCell>
                               <TableCell>
                                  <Select value={promotionData[student.id]?.toClass} onValueChange={(val) => handlePromotionDataChange(student.id, 'toClass', val)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                  </Select>
                              </TableCell>
                              <TableCell>
                                  <Select value={promotionData[student.id]?.toSection} onValueChange={(val) => handlePromotionDataChange(student.id, 'toSection', val)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                                  </Select>
                              </TableCell>
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