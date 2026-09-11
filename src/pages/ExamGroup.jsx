import { useState, useEffect } from 'react';
import { ExamGroup as ExamGroupEntity } from '@/entities/ExamGroup';
import { Session } from '@/entities/Session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash, Copy, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export default function ExamGroup() {
  const [examGroups, setExamGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState('');
  const [formData, setFormData] = useState({ id: null, name: '', exam_type: '', academic_session: '', description: '' });
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGroups();
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await Session.list('-created_date');
    setSessions(data);
    const current = data.find(s => s.is_current);
    if (current) {
      setCurrentSession(current.name);
      setFormData(prev => ({ ...prev, academic_session: prev.academic_session || current.name }));
    } else if (data.length > 0) {
      setFormData(prev => ({ ...prev, academic_session: prev.academic_session || data[0].name }));
    }
  };

  useEffect(() => {
    filterGroups();
  }, [examGroups, searchTerm]);

  const loadGroups = async () => {
    const data = await ExamGroupEntity.list('-created_date');
    setExamGroups(data);
  };

  const filterGroups = () => {
    const filtered = examGroups.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.exam_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGroups(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', exam_type: '', academic_session: currentSession, description: '' });
    setShowDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.exam_type || !formData.academic_session) {
      alert('Please fill all required fields.');
      return;
    }
    
    const dataToSave = { ...formData };
    delete dataToSave.id;

    try {
      if (formData.id) {
        await ExamGroupEntity.update(formData.id, dataToSave);
      } else {
        await ExamGroupEntity.create(dataToSave);
      }
      resetForm();
      loadGroups();
    } catch (error) {
      console.error('Failed to save exam group:', error);
    }
  };

  const handleEdit = (group) => {
    setFormData({
      id: group.id,
      name: group.name,
      exam_type: group.exam_type,
      academic_session: group.academic_session,
      description: group.description,
    });
    setShowDialog(true);
  };

  const handleDuplicate = (group) => {
    setFormData({
      id: null, // Ensure it creates a new one
      name: `${group.name} (Copy)`,
      exam_type: group.exam_type,
      academic_session: group.academic_session,
      description: group.description,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam group?')) {
      try {
        await ExamGroupEntity.delete(id);
        loadGroups();
      } catch (error) {
        console.error('Failed to delete exam group:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Exam Group Management</h1>
          <p className="text-gray-500">Create and manage exam categories for academic sessions.</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Create Exam Group
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit' : 'Create'} Exam Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exam Group Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type</Label>
              <Input id="exam_type" name="exam_type" value={formData.exam_type} onChange={handleInputChange} placeholder="e.g., Unit Test, Half-Yearly, Annual" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_session">Academic Session</Label>
              <Select name="academic_session" value={formData.academic_session} onValueChange={(v) => handleSelectChange('academic_session', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Exam Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-start mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map(group => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.exam_type}</TableCell>
                  <TableCell>{group.academic_session}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(group)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(group.id)}><Trash className="h-4 w-4" /></Button>
                    </div>
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