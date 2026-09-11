import { useState, useEffect } from 'react';
import { ItemSupplier } from '@/entities/ItemSupplier';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ItemSupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [currentSupplier, setCurrentSupplier] = useState({ 
    name: '', contact_person: '', phone: '', email: '', address: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const data = await ItemSupplier.list();
    setSuppliers(data);
  };

  const handleSave = async () => {
    if (isEditing) {
      await ItemSupplier.update(currentSupplier.id, currentSupplier);
    } else {
      await ItemSupplier.create(currentSupplier);
    }
    fetchSuppliers();
    closeDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
        await ItemSupplier.delete(id);
        fetchSuppliers();
    }
  };

  const openDialog = (supplier = null) => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setIsEditing(true);
    } else {
      setCurrentSupplier({ name: '', contact_person: '', phone: '', email: '', address: '' });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Item Suppliers</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Supplier List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Add'} Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Supplier Name</Label>
                <Input id="name" value={currentSupplier.name} onChange={(e) => setCurrentSupplier({...currentSupplier, name: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" value={currentSupplier.contact_person} onChange={(e) => setCurrentSupplier({...currentSupplier, contact_person: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={currentSupplier.phone} onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={currentSupplier.email} onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={currentSupplier.address} onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}