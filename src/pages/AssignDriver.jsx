
import { useState, useEffect } from 'react';
import { Vehicle } from '@/entities/Vehicle';
import { Staff } from '@/entities/Staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car } from 'lucide-react';

const UNASSIGNED = '__none__';

export default function AssignDriver() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [vehiclesData, staffData] = await Promise.all([
      Vehicle.list(),
      Staff.filter({ designation: 'Driver', status: 'active' })
    ]);
    setVehicles(vehiclesData);
    setDrivers(staffData);
  };

  const handleDriverChange = async (vehicleId, driverId) => {
    try {
      if (driverId === UNASSIGNED) {
        await Vehicle.update(vehicleId, { driver_name: '', driver_phone: '' });
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, driver_name: '', driver_phone: '' } : v));
      } else {
        const driver = drivers.find(d => d.id === driverId);
        if (!driver) return;
        const fullName = `${driver.first_name} ${driver.last_name}`.trim();
        await Vehicle.update(vehicleId, { driver_name: fullName, driver_phone: driver.phone || '' });
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, driver_name: fullName, driver_phone: driver.phone || '' } : v));
      }
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Failed to assign driver. Please try again.');
    }
  };

  const getSelectValue = (vehicle) => {
    if (!vehicle.driver_name) return UNASSIGNED;
    const match = drivers.find(d => `${d.first_name} ${d.last_name}`.trim() === vehicle.driver_name);
    return match ? match.id : UNASSIGNED;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assign Drivers to Vehicles</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Car/> Driver Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Registration No.</TableHead>
                <TableHead>Current Driver</TableHead>
                <TableHead>Assign Driver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map(vehicle => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.model || vehicle.vehicle_number || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{vehicle.registration_number || vehicle.vehicle_number || '-'}</TableCell>
                  <TableCell>
                    {vehicle.driver_name || 'Not Assigned'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={getSelectValue(vehicle)}
                      onValueChange={(driverId) => handleDriverChange(vehicle.id, driverId)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>-- Unassign --</SelectItem>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.first_name} {driver.last_name} ({driver.staff_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
