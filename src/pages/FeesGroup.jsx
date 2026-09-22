import { useState, useEffect } from 'react';
import { FeesGroup } from '@/entities/FeesGroup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function FeesGroupPage() {
  const [feesGroups, setFeesGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFeesGroups();
  }, []);

  const loadFeesGroups = async () => {
    try {
      const data = await FeesGroup.list('-created_date');
      setFeesGroups(data);
    } catch (error) {
      console.error('Error loading fees groups:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter fees group name');
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingId) {
        await FeesGroup.update(editingId, formData);
        alert('Fees group updated successfully!');
      } else {
        await FeesGroup.create(formData);
        alert('Fees group added successfully!');
      }
      
      setFormData({ name: '', description: '' });
      setEditingId(null);
      loadFeesGroups();
    } catch (error) {
      console.error('Error saving fees group:', error);
      alert('Error saving fees group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (feesGroup) => {
    setFormData({
      name: feesGroup.name,
      description: feesGroup.description || ''
    });
    setEditingId(feesGroup.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fees group?')) {
      try {
        await FeesGroup.delete(id);
        alert('Fees group deleted successfully!');
        loadFeesGroups();
      } catch (error) {
        console.error('Error deleting fees group:', error);
        alert('Error deleting fees group. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fees Group</h1>
          <p className="text-gray-500">Create and manage fees groups to associate with classes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {editingId ? 'Edit Fees Group' : 'Add Fees Group'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Fees Group Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Primary Group, Secondary Group, Quarterly Fees"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description for this fees group"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick Add Suggestions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Quick Add Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Nursery Group',
                'Primary Group',
                'Secondary Group',
                'Senior Secondary Group',
                'Monthly Fees Group',
                'Quarterly Fees Group',
                'Annual Fees Group',
                'Admission Group',
                'Examination Group',
                'Activity Fees Group'
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('name', suggestion)}
                  className="w-full justify-start text-left h-auto py-1"
                >
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Fees Groups List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Fees Groups ({feesGroups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No fees groups found. Add your first fees group to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feesGroups.map((feesGroup) => (
                        <TableRow key={feesGroup.id}>
                          <TableCell>
                            <div className="font-medium">{feesGroup.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {feesGroup.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {format(new Date(feesGroup.created_date), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(feesGroup)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(feesGroup.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}