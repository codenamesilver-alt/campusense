import { useState, useEffect } from 'react';
import { FeesType } from '@/entities/FeesType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function FeesTypePage() {
  const [feesTypes, setFeesTypes] = useState([]);
  const [formData, setFormData] = useState({
    fees_type_name: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFeesTypes();
  }, []);

  const loadFeesTypes = async () => {
    try {
      const data = await FeesType.list('-created_date');
      setFeesTypes(data);
    } catch (error) {
      console.error('Error loading fees types:', error);
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
    
    if (!formData.fees_type_name.trim()) {
      alert('Please enter fees type name');
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingId) {
        await FeesType.update(editingId, formData);
        alert('Fees type updated successfully!');
      } else {
        await FeesType.create(formData);
        alert('Fees type added successfully!');
      }
      
      setFormData({ fees_type_name: '', description: '' });
      setEditingId(null);
      loadFeesTypes();
    } catch (error) {
      console.error('Error saving fees type:', error);
      alert('Error saving fees type. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (feesType) => {
    setFormData({
      fees_type_name: feesType.fees_type_name,
      description: feesType.description || ''
    });
    setEditingId(feesType.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fees type?')) {
      try {
        await FeesType.delete(id);
        alert('Fees type deleted successfully!');
        loadFeesTypes();
      } catch (error) {
        console.error('Error deleting fees type:', error);
        alert('Error deleting fees type. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ fees_type_name: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fees Type</h1>
          <p className="text-gray-500">Create and manage different types of fees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {editingId ? 'Edit Fees Type' : 'Add Fees Type'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fees_type_name">Fees Type Name *</Label>
                  <Input
                    id="fees_type_name"
                    placeholder="e.g., Admission Fees, Monthly Fees, Exam Fees"
                    value={formData.fees_type_name}
                    onChange={(e) => handleInputChange('fees_type_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description for this fees type"
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
                'Admission Fees',
                'Annual Fees', 
                'Monthly Fees',
                'Exam Fees',
                'Library Fees',
                'Lab Fees',
                'Transport Fees',
                'Sports Fees',
                'January Fees',
                'February Fees',
                'March Fees',
                'April Fees',
                'May Fees',
                'June Fees',
                'July Fees',
                'August Fees',
                'September Fees',
                'October Fees',
                'November Fees',
                'December Fees'
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('fees_type_name', suggestion)}
                  className="w-full justify-start text-left h-auto py-1"
                >
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Fees Types List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Fees Types ({feesTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fees Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No fees types found. Add your first fees type to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feesTypes.map((feesType) => (
                        <TableRow key={feesType.id}>
                          <TableCell>
                            <div className="font-medium">{feesType.fees_type_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {feesType.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {format(new Date(feesType.created_date), 'dd/MM/yyyy')}
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
                                onClick={() => handleEdit(feesType)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(feesType.id)}
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