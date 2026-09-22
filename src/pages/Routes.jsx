import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStop, setNewStop] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [routesData, vehiclesData, staffData] = await Promise.all([
      base44.entities.Route.list('-created_date'),
      base44.entities.Vehicle.filter({ status: 'active' }),
      base44.entities.Staff.filter({ status: 'active' })
    ]);
    setRoutes(routesData);
    setVehicles(vehiclesData);
    
    // Filter staff to get only drivers (you can filter by designation or role)
    // If you have a specific designation "Driver" in your system
    const driverStaff = staffData.filter(s => 
      s.designation?.toLowerCase().includes('driver') || 
      s.role === 'driver'
    );
    setDrivers(driverStaff);
  };

  const handleSave = async () => {
    const payload = {
      name: currentRoute.name,
      fee: currentRoute.fee,
      status: currentRoute.status
    };
    if (currentRoute.id) {
      await base44.entities.Route.update(currentRoute.id, payload);
    } else {
      await base44.entities.Route.create(payload);
    }
    fetchData();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      await base44.entities.Route.delete(id);
      fetchData();
    }
  };

  const openDialog = (route = null) => {
    setCurrentRoute(route || {
      name: '', stops: [], vehicle_id: '', driver_id: '', fee: 0, status: 'active'
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewStop('');
  };

  const handleAddStop = () => {
    if (newStop && !currentRoute.stops?.includes(newStop)) {
      setCurrentRoute(prev => ({...prev, stops: [...(prev.stops || []), newStop]}));
      setNewStop('');
    }
  };

  const handleRemoveStop = (stopToRemove) => {
    setCurrentRoute(prev => ({
        ...prev,
        stops: (prev.stops || []).filter(stop => stop !== stopToRemove)
    }));
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'N/A';
  };

  const getVehicleNumber = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.vehicle_number : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transport Routes</h1>
        <Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" /> Add Route</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Route List</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No routes found. Add your first route!
                  </TableCell>
                </TableRow>
              ) : (
                routes.map(route => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>{route.stops?.length || 0}</TableCell>
                    <TableCell>{getVehicleNumber(route.vehicle_id)}</TableCell>
                    <TableCell>{getDriverName(route.driver_id)}</TableCell>
                    <TableCell>₹{route.fee}</TableCell>
                    <TableCell><Badge>{route.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(route)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(route.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{currentRoute?.id ? 'Edit' : 'Add'} Route</DialogTitle></DialogHeader>
          {currentRoute && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Route Name</Label>
                  <Input value={currentRoute.name || ''} onChange={(e) => setCurrentRoute({ ...currentRoute, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Route Fee (₹)</Label>
                  <Input type="number" value={currentRoute.fee || 0} onChange={(e) => setCurrentRoute({ ...currentRoute, fee: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <Select value={currentRoute.vehicle_id || ''} onValueChange={(val) => setCurrentRoute({...currentRoute, vehicle_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Assign Vehicle"/></SelectTrigger>
                        <SelectContent>
                          {vehicles.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No vehicles found. Add vehicles first.</div>
                          ) : (
                            vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.model} ({v.vehicle_number})</SelectItem>)
                          )}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Driver</Label>
                    <Select value={currentRoute.driver_id || ''} onValueChange={(val) => setCurrentRoute({...currentRoute, driver_id: val})}>
                        <SelectTrigger><SelectValue placeholder="Assign Driver"/></SelectTrigger>
                        <SelectContent>
                          {drivers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              No drivers found. Add staff with "Driver" designation first.
                            </div>
                          ) : (
                            drivers.map(d => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.first_name} {d.last_name} - {d.staff_id}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="space-y-2">
                <Label>Stops</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a new stop" 
                    value={newStop} 
                    onChange={(e) => setNewStop(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStop())}
                  />
                  <Button type="button" onClick={handleAddStop}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentRoute.stops?.map((stop, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {stop}
                      <button type="button" onClick={() => handleRemoveStop(stop)}><X className="h-3 w-3"/></button>
                    </Badge>
                  ))}
                  {(!currentRoute.stops || currentRoute.stops.length === 0) && (
                    <p className="text-sm text-gray-500">No stops added yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Route</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}