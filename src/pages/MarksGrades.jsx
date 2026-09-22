import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash } from 'lucide-react';
import { GradeConfiguration } from '@/entities/GradeConfiguration';
import { DivisionConfiguration } from '@/entities/DivisionConfiguration';

const GradeConfigTab = () => {
    const [grades, setGrades] = useState([]);
    const [newGrade, setNewGrade] = useState({ grade: '', min_percentage: '', max_percentage: '', description: '' });

    useEffect(() => { loadGrades(); }, []);
    
    const loadGrades = async () => setGrades(await GradeConfiguration.list());
    
    const handleAddGrade = async () => {
        if(!newGrade.grade || !newGrade.min_percentage || !newGrade.max_percentage) return;
        await GradeConfiguration.create({
            name: newGrade.grade,
            grade: newGrade.grade,
            min_percentage: String(newGrade.min_percentage),
            max_percentage: String(newGrade.max_percentage),
            description: newGrade.description
        });
        setNewGrade({ grade: '', min_percentage: '', max_percentage: '', description: '' });
        loadGrades();
    };

    const handleDeleteGrade = async (id) => {
        await GradeConfiguration.delete(id);
        loadGrades();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
                <Input placeholder="Grade (e.g., A1)" value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value})} />
                <Input placeholder="Min %" type="number" value={newGrade.min_percentage} onChange={e => setNewGrade({...newGrade, min_percentage: e.target.value})} />
                <Input placeholder="Max %" type="number" value={newGrade.max_percentage} onChange={e => setNewGrade({...newGrade, max_percentage: e.target.value})} />
                <Input placeholder="Remark (e.g., Excellent)" value={newGrade.description} onChange={e => setNewGrade({...newGrade, description: e.target.value})} />
                <Button onClick={handleAddGrade}><Plus className="mr-2 h-4 w-4"/> Add Grade</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Percentage Range</TableHead><TableHead>Remark</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {grades.map(g => (
                        <TableRow key={g.id}>
                            <TableCell>{g.grade}</TableCell>
                            <TableCell>{g.min_percentage}% - {g.max_percentage}%</TableCell>
                            <TableCell>{g.description}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(g.id)}><Trash className="h-4 w-4 text-red-500"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const DivisionConfigTab = () => {
    const [divisions, setDivisions] = useState([]);
    const [newDivision, setNewDivision] = useState({ name: '', min_percentage: '' });

    useEffect(() => { loadDivisions(); }, []);

    const loadDivisions = async () => setDivisions(await DivisionConfiguration.list());

    const handleAddDivision = async () => {
        if(!newDivision.name || !newDivision.min_percentage) return;
        await DivisionConfiguration.create({ name: newDivision.name, min_percentage: Number(newDivision.min_percentage) });
        setNewDivision({ name: '', min_percentage: '' });
        loadDivisions();
    };
    
    const handleDeleteDivision = async (id) => {
        await DivisionConfiguration.delete(id);
        loadDivisions();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Division (e.g., First Division)" value={newDivision.name} onChange={e => setNewDivision({...newDivision, name: e.target.value})} />
                <Input placeholder="Min %" type="number" value={newDivision.min_percentage} onChange={e => setNewDivision({...newDivision, min_percentage: e.target.value})} />
                <Button onClick={handleAddDivision}><Plus className="mr-2 h-4 w-4"/> Add Division</Button>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>Division</TableHead><TableHead>Minimum Percentage</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {divisions.map(d => (
                        <TableRow key={d.id}>
                            <TableCell>{d.name}</TableCell>
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
          <Card><CardHeader><CardTitle>Grade Rules</CardTitle></CardHeader><CardContent><GradeConfigTab /></CardContent></Card>
        </TabsContent>
        <TabsContent value="divisions">
          <Card><CardHeader><CardTitle>Division Rules</CardTitle></CardHeader><CardContent><DivisionConfigTab /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}