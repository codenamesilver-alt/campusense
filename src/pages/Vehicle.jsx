import { useState, useEffect } from 'react';
import { Vehicle } from '@/entities/Vehicle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState([]);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setVehicles(await Vehicle.list('-created_date'));
  };

  const handleSave = async () => {
    const payload = {
      registration_number: currentVehicle.vehicle_number,
      vehicle_number: currentVehicle.vehicle_number,
      vehicle_type: currentVehicle.model,
      model: currentVehicle.model,
      capacity: currentVehicle.capacity,
      insurance_expiry: currentVehicle.insurance_expiry,
      status: currentVehicle.status
    };
    if (currentVehicle.id) {
      await Vehicle.update(currentVehicle.id, payload);
    } else {
      await Vehicle.create(payload);
    }
    fetchData();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      await Vehicle.delete(id);
      fetchData();
    }
  };

  const openDialog = (vehicle = null) => {
    setCurrentVehicle(vehicle || {
      vehicle_number: '', model: '', capacity: 0, insurance_expiry: '', status: 'active'
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Vehicles</h1>
        <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Vehicle List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Insurance Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map(vehicle => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.capacity}</TableCell>
                  <TableCell>{vehicle.insurance_expiry ? format(new Date(vehicle.insurance_expiry), 'dd MMM, yyyy') : 'N/A'}</TableCell>
                  <TableCell><Badge>{vehicle.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(vehicle)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentVehicle?.id ? 'Edit' : 'Add'} Vehicle</DialogTitle></DialogHeader>
          {currentVehicle && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={currentVehicle.vehicle_number} onChange={(e) => setCurrentVehicle({ ...currentVehicle, vehicle_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={currentVehicle.model} onChange={(e) => setCurrentVehicle({ ...currentVehicle, model: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={currentVehicle.capacity} onChange={(e) => setCurrentVehicle({ ...currentVehicle, capacity: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Insurance Expiry</Label>
                <Input type="date" value={currentVehicle.insurance_expiry} onChange={(e) => setCurrentVehicle({ ...currentVehicle, insurance_expiry: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}