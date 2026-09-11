import { useState, useEffect } from 'react';
import { Subject as SubjectEntity, SubjectGroup as SubjectGroupEntity, Class as ClassEntity } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SubjectsTab = () => {
  const [subjects, setSubjects] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', code: '', type: 'scholastic' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => setSubjects(await SubjectEntity.list('name'));
  
  const resetForm = () => {
    setFormData({ id: null, name: '', code: '', type: 'scholastic' });
    setShowDialog(false);
  };
  
  const handleEdit = (s) => {
    setFormData({ id: s.id, name: s.name, code: s.code, type: s.type });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await SubjectEntity.delete(id);
      loadData();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.id) {
      await SubjectEntity.update(formData.id, formData);
    } else {
      await SubjectEntity.create(formData);
    }
    resetForm();
    loadData();
  };

  return (
    <div className="space-y-4">
      <div className="text-right">
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{formData.id ? 'Edit' : 'Add'} Subject</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input placeholder="Subject Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input placeholder="Subject Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
            <Select value={formData.type} onValueChange={type => setFormData({...formData, type})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="scholastic">Scholastic</SelectItem>
                <SelectItem value="co-scholastic">Co-Scholastic</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {subjects.map(s => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell><TableCell>{s.code}</TableCell><TableCell>{s.type}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const SubjectGroupsTab = () => {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', class_id: '', subject_ids: [] });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setGroups(await SubjectGroupEntity.list('name'));
    setSubjects(await SubjectEntity.list('name'));
    setClasses(await ClassEntity.list('numeric_value'));
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', class_id: '', subject_ids: [] });
    setShowDialog(false);
  };

  const handleEdit = (g) => {
    const cls = classes.find(c => c.name === g.class_name);
    setFormData({ id: g.id, name: g.name, class_id: cls ? cls.id : '', subject_ids: g.subject_ids || [] });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await SubjectGroupEntity.delete(id);
      loadData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cls = classes.find(c => c.id === formData.class_id);
    const payload = {
      name: formData.name,
      class_name: cls ? cls.name : '',
      subject_ids: JSON.stringify(formData.subject_ids)
    };
    if (formData.id) {
      await SubjectGroupEntity.update(formData.id, payload);
    } else {
      await SubjectGroupEntity.create(payload);
    }
    resetForm();
    loadData();
  };

  const handleSubjectSelection = (subjectId) => {
    setFormData(prev => {
      const newSubjectIds = prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId];
      return { ...prev, subject_ids: newSubjectIds };
    });
  };

  const getClassName = (g) => g.class_name || classes.find(c => c.id === g.class_id)?.name;
  const getSubjectNames = (ids) => ids.map(id => subjects.find(s => s.id === id)?.name).join(', ');

  return (
    <div className="space-y-4">
      <div className="text-right">
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Subject Group</Button>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{formData.id ? 'Edit' : 'Add'} Subject Group</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input placeholder="Group Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Select value={formData.class_id} onValueChange={id => setFormData({...formData, class_id: id})} required>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <p className="font-medium">Select Subjects:</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`sub-${s.id}`} 
                    checked={formData.subject_ids.includes(s.id)}
                    onCheckedChange={() => handleSubjectSelection(s.id)}
                  />
                  <label htmlFor={`sub-${s.id}`}>{s.name}</label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader><TableRow><TableHead>Group Name</TableHead><TableHead>Class</TableHead><TableHead>Subjects</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {groups.map(g => (
            <TableRow key={g.id}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{getClassName(g)}</TableCell>
              <TableCell className="max-w-xs truncate">{getSubjectNames(g.subject_ids)}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default function SubjectGroupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subjects & Subject Groups</h1>
      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Manage Subjects</TabsTrigger>
          <TabsTrigger value="groups">Manage Subject Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="subjects">
          <Card><CardHeader><CardTitle>All Subjects</CardTitle></CardHeader><CardContent><SubjectsTab /></CardContent></Card>
        </TabsContent>
        <TabsContent value="groups">
          <Card><CardHeader><CardTitle>All Subject Groups</CardTitle></CardHeader><CardContent><SubjectGroupsTab /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}