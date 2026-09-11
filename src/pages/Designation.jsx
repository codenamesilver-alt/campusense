import { useState, useEffect } from 'react';
import { Designation } from '@/entities/Designation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function DesignationPage() {
  const [designations, setDesignations] = useState([]);
  const [currentDesignation, setCurrentDesignation] = useState({ name: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    const data = await Designation.list();
    setDesignations(data);
  };

  const handleSave = async () => {
    if (isEditing) {
      await Designation.update(currentDesignation.id, { name: currentDesignation.name });
    } else {
      await Designation.create(currentDesignation);
    }
    fetchDesignations();
    closeDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
        await Designation.delete(id);
        fetchDesignations();
    }
  };

  const openDialog = (designation = null) => {
    if (designation) {
      setCurrentDesignation(designation);
      setIsEditing(true);
    } else {
      setCurrentDesignation({ name: '' });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Designations</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Designation
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Designation List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designation Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map(desig => (
                <TableRow key={desig.id}>
                  <TableCell className="font-medium">{desig.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(desig)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(desig.id)}>
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
            <DialogTitle>{isEditing ? 'Edit' : 'Add'} Designation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Designation Name</Label>
                <Input id="name" value={currentDesignation.name} onChange={(e) => setCurrentDesignation({ ...currentDesignation, name: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Designation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}