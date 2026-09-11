import { useState, useEffect } from 'react';
import { Department } from '@/entities/Department';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [currentDepartment, setCurrentDepartment] = useState({ name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const data = await Department.list();
    setDepartments(data);
  };

  const handleSave = async () => {
    if (isEditing) {
      await Department.update(currentDepartment.id, { name: currentDepartment.name, description: currentDepartment.description });
    } else {
      await Department.create(currentDepartment);
    }
    fetchDepartments();
    closeDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
        await Department.delete(id);
        fetchDepartments();
    }
  };

  const openDialog = (department = null) => {
    if (department) {
      setCurrentDepartment(department);
      setIsEditing(true);
    } else {
      setCurrentDepartment({ name: '', description: '' });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Departments</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Department List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Add'} Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input id="name" value={currentDepartment.name} onChange={(e) => setCurrentDepartment({...currentDepartment, name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={currentDepartment.description} onChange={(e) => setCurrentDepartment({...currentDepartment, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}