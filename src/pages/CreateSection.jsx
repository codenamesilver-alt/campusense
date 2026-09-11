import { useState, useEffect } from 'react';
import { Section as SectionEntity } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function CreateSection() {
  const [sections, setSections] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '' });

  useEffect(() => { loadSections(); }, []);
  const loadSections = async () => setSections(await SectionEntity.list('name'));
  
  const resetForm = () => {
    setFormData({ id: null, name: '' });
    setShowDialog(false);
  };
  
  const handleEdit = (s) => {
    setFormData({ id: s.id, name: s.name });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await SectionEntity.delete(id);
      loadSections();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = { name: formData.name };
    if (formData.id) {
      await SectionEntity.update(formData.id, dataToSave);
    } else {
      await SectionEntity.create(dataToSave);
    }
    resetForm();
    loadSections();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Sections</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{formData.id ? 'Edit' : 'Add'} Section</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input placeholder="Section Name (e.g., A)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader><CardTitle>Existing Sections</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Section Name</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sections.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
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