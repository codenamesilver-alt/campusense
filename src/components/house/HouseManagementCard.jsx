import { useState } from 'react';
import { StudentHouse } from '@/entities/StudentHouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export default function HouseManagementCard({ houses, onHousesUpdate }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [houseName, setHouseName] = useState('');
  const [houseColor, setHouseColor] = useState('#ffffff');

  const openAddDialog = () => {
    setIsEditing(null);
    setHouseName('');
    setHouseColor('#ffffff');
    setIsDialogOpen(true);
  };

  const openEditDialog = (house) => {
    setIsEditing(house);
    setHouseName(house.house_name);
    setHouseColor(house.house_color || '#ffffff');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!houseName) {
      alert('House name is required.');
      return;
    }

    try {
      if (isEditing) {
        await StudentHouse.update(isEditing.id, { house_name: houseName, house_color: houseColor });
      } else {
        await StudentHouse.create({ house_name: houseName, house_color: houseColor });
      }
      onHousesUpdate();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving house:', error);
      alert('Failed to save house.');
    }
  };

  const handleDelete = async (houseId) => {
    if (window.confirm('Are you sure you want to delete this house? This cannot be undone.')) {
      try {
        await StudentHouse.delete(houseId);
        onHousesUpdate();
      } catch (error) {
        console.error('Error deleting house:', error);
        alert('Failed to delete house.');
      }
    }
  };

  return (
    <Card className="bg-[hsl(var(--card)/0.8)] border-[hsl(var(--border)/0.5)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Houses</CardTitle>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add House
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {houses.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No houses created yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {houses.map((house) => (
                <li key={house.id} className="flex items-center justify-between p-3 bg-[hsl(var(--muted)/0.5)] rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: house.house_color }}></div>
                    <span className="font-medium">{house.house_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(house)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => handleDelete(house.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit House' : 'Add New House'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="house-name">House Name</Label>
              <Input
                id="house-name"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                placeholder="e.g., Gryffindor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="house-color">House Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="house-color"
                  type="color"
                  value={houseColor}
                  onChange={(e) => setHouseColor(e.target.value)}
                  className="p-1 h-10 w-14"
                />
                <Input
                    value={houseColor}
                    onChange={(e) => setHouseColor(e.target.value)}
                    placeholder="#FF0000"
                    className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}