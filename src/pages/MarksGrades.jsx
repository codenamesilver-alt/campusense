import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash } from 'lucide-react';
import { GradeConfiguration } from '@/entities/GradeConfiguration';
import { DivisionConfiguration } from '@/entities/DivisionConfiguration';
import { base44 } from '@/api/base44Client';

const GradeConfigTab = ({ sessions, currentSession }) => {
    const [grades, setGrades] = useState([]);
    const [newGrade, setNewGrade] = useState({ grade_name: '', min_percentage: '', max_percentage: '', remark: '', academic_session: currentSession });

    useEffect(() => {
        setNewGrade(prev => ({ ...prev, academic_session: currentSession }));
    }, [currentSession]);

    useEffect(() => { loadGrades(); }, []);
    
    const loadGrades = async () => setGrades(await GradeConfiguration.list());
    
    const handleAddGrade = async () => {
        if(!newGrade.grade_name || !newGrade.min_percentage || !newGrade.max_percentage) return;
        await GradeConfiguration.create({...newGrade, min_percentage: Number(newGrade.min_percentage), max_percentage: Number(newGrade.max_percentage)});
        setNewGrade({ grade_name: '', min_percentage: '', max_percentage: '', remark: '', academic_session: currentSession });
        loadGrades();
    };

    const handleDeleteGrade = async (id) => {
        await GradeConfiguration.delete(id);
        loadGrades();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
                <Input placeholder="Grade (e.g., A1)" value={newGrade.grade_name} onChange={e => setNewGrade({...newGrade, grade_name: e.target.value})} />
                <Input placeholder="Min %" type="number" value={newGrade.min_percentage} onChange={e => setNewGrade({...newGrade, min_percentage: e.target.value})} />
                <Input placeholder="Max %" type="number" value={newGrade.max_percentage} onChange={e => setNewGrade({...newGrade, max_percentage: e.target.value})} />
                <Input placeholder="Remark (e.g., Excellent)" value={newGrade.remark} onChange={e => setNewGrade({...newGrade, remark: e.target.value})} />
                <Select value={newGrade.academic_session} onValueChange={v => setNewGrade({...newGrade, academic_session: v})}>
                    <SelectTrigger><SelectValue placeholder="Session"/></SelectTrigger>
                    <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={handleAddGrade}><Plus className="mr-2 h-4 w-4"/> Add Grade</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Percentage Range</TableHead><TableHead>Remark</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {grades.map(g => (
                        <TableRow key={g.id}>
                            <TableCell>{g.grade_name}</TableCell>
                            <TableCell>{g.min_percentage}% - {g.max_percentage}%</TableCell>
                            <TableCell>{g.remark}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(g.id)}><Trash className="h-4 w-4 text-red-500"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const DivisionConfigTab = ({ sessions, currentSession }) => {
    const [divisions, setDivisions] = useState([]);
    const [newDivision, setNewDivision] = useState({ division_name: '', min_percentage: '', academic_session: currentSession });

    useEffect(() => {
        setNewDivision(prev => ({ ...prev, academic_session: currentSession }));
    }, [currentSession]);

    useEffect(() => { loadDivisions(); }, []);

    const loadDivisions = async () => setDivisions(await DivisionConfiguration.list());

    const handleAddDivision = async () => {
        if(!newDivision.division_name || !newDivision.min_percentage) return;
        await DivisionConfiguration.create({...newDivision, min_percentage: Number(newDivision.min_percentage)});
        setNewDivision({ division_name: '', min_percentage: '', academic_session: currentSession });
        loadDivisions();
    };
    
    const handleDeleteDivision = async (id) => {
        await DivisionConfiguration.delete(id);
        loadDivisions();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Division (e.g., First Division)" value={newDivision.division_name} onChange={e => setNewDivision({...newDivision, division_name: e.target.value})} />
                <Input placeholder="Min %" type="number" value={newDivision.min_percentage} onChange={e => setNewDivision({...newDivision, min_percentage: e.target.value})} />
                <Select value={newDivision.academic_session} onValueChange={v => setNewDivision({...newDivision, academic_session: v})}>
                    <SelectTrigger><SelectValue placeholder="Session"/></SelectTrigger>
                    <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={handleAddDivision}><Plus className="mr-2 h-4 w-4"/> Add Division</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Division</TableHead><TableHead>Minimum Percentage</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {divisions.map(d => (
                        <TableRow key={d.id}>
                            <TableCell>{d.division_name}</TableCell>
                            <TableCell>&gt;= {d.min_percentage}%</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteDivision(d.id)}><Trash className="h-4 w-4 text-red-500"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};


export default function MarksGrades() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState('');

  useEffect(() => {
    base44.entities.Session.list().then(data => {
      setSessions(data);
      const current = data.find(s => s.is_current) || data[0];
      if (current) setCurrentSession(current.name);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marks & Grades Configuration</h1>
      <p className="text-gray-500">Define the grading and division rules for your school.</p>
      
      <Tabs defaultValue="grades">
        <TabsList>
          <TabsTrigger value="grades">Grade Configuration</TabsTrigger>
          <TabsTrigger value="divisions">Division Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="grades">
          <Card><CardHeader><CardTitle>Grade Rules</CardTitle></CardHeader><CardContent><GradeConfigTab sessions={sessions} currentSession={currentSession} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="divisions">
          <Card><CardHeader><CardTitle>Division Rules</CardTitle></CardHeader><CardContent><DivisionConfigTab sessions={sessions} currentSession={currentSession} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}