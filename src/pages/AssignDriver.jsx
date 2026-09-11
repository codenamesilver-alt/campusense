
import { useState, useEffect } from 'react';
import { Route } from '@/entities/Route';
import { Staff } from '@/entities/Staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car } from 'lucide-react';

export default function AssignDriver() {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [routesData, staffData] = await Promise.all([
      Route.list(),
      Staff.filter({ designation: 'Driver', status: 'active' })
    ]);
    setRoutes(routesData);
    setDrivers(staffData);
  };

  const handleDriverChange = async (routeId, driverId) => {
    try {
      await Route.update(routeId, { driver_id: driverId || null });
      // Optimistically update UI
      setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, driver_id: driverId || null } : r));
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Failed to assign driver. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assign Drivers to Routes</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Car/> Driver Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Current Driver</TableHead>
                <TableHead>Assign New Driver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map(route => {
                const currentDriver = drivers.find(d => d.id === route.driver_id);
                return (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>
                      {currentDriver ? `${currentDriver.first_name} ${currentDriver.last_name}` : 'Not Assigned'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={route.driver_id || ''}
                        onValueChange={(driverId) => handleDriverChange(route.id, driverId)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select a driver..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>-- Unassign --</SelectItem>
                          {drivers.map(driver => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.first_name} {driver.last_name} ({driver.staff_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
