import { useState, useEffect } from 'react';
import { FeesMaster } from '@/entities/FeesMaster';
import { FeesGroup } from '@/entities/FeesGroup';
import { FeesType } from '@/entities/FeesType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';

export default function FeesMasterPage() {
  const [feesMasters, setFeesMasters] = useState([]);
  const [feesGroups, setFeesGroups] = useState([]);
  const [feesTypes, setFeesTypes] = useState([]);
  const [formData, setFormData] = useState({
    fees_group: '',
    fees_type: '',
    class: '',
    section: '',
    amount: '',
    due_date: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mastersData, groupsData, typesData] = await Promise.all([
        FeesMaster.list('-created_date'),
        FeesGroup.list(),
        FeesType.list()
      ]);
      
      setFeesMasters(mastersData);
      setFeesGroups(groupsData);
      setFeesTypes(typesData);
    } catch (error) {
      console.error('Error loading data:', error);
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
    
    if (!formData.fees_group || !formData.fees_type || !formData.class || !formData.amount || !formData.due_date) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      if (editingId) {
        await FeesMaster.update(editingId, submitData);
        alert('Fees master updated successfully!');
      } else {
        await FeesMaster.create(submitData);
        alert('Fees master created successfully!');
      }
      
      setFormData({
        fees_group: '',
        fees_type: '',
        class: '',
        section: '',
        amount: '',
        due_date: ''
      });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error saving fees master:', error);
      alert('Error saving fees master. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (feesMaster) => {
    setFormData({
      fees_group: feesMaster.fees_group,
      fees_type: feesMaster.fees_type,
      class: feesMaster.class,
      section: feesMaster.section || '',
      amount: feesMaster.amount.toString(),
      due_date: feesMaster.due_date
    });
    setEditingId(feesMaster.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fees master?')) {
      try {
        await FeesMaster.delete(id);
        alert('Fees master deleted successfully!');
        loadData();
      } catch (error) {
        console.error('Error deleting fees master:', error);
        alert('Error deleting fees master. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setFormData({
      fees_group: '',
      fees_type: '',
      class: '',
      section: '',
      amount: '',
      due_date: ''
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fees Master</h1>
          <p className="text-gray-500">Create complete fees structure for classes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {editingId ? 'Edit Fees Master' : 'Create Fees Master'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fees_group">Fees Group *</Label>
                  <Select value={formData.fees_group} onValueChange={(value) => handleInputChange('fees_group', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fees group" />
                    </SelectTrigger>
                    <SelectContent>
                      {feesGroups.map(group => (
                        <SelectItem key={group.id} value={group.fees_group_name}>
                          {group.fees_group_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fees_type">Fees Type *</Label>
                  <Select value={formData.fees_type} onValueChange={(value) => handleInputChange('fees_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fees type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feesTypes.map(type => (
                        <SelectItem key={type.id} value={type.fees_type_name}>
                          {type.fees_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="LKG">LKG</SelectItem>
                        <SelectItem value="UKG">UKG</SelectItem>
                        {Array.from({length: 12}, (_, i) => (
                          <SelectItem key={i} value={`${i + 1}`}>Class {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>All Sections</SelectItem>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                        <SelectItem value="D">Section D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Fees Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
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
        </div>

        {/* Fees Masters List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Fees Masters ({feesMasters.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group & Type</TableHead>
                      <TableHead>Class/Section</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesMasters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No fees masters found. Create your first fees structure to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feesMasters.map((feesMaster) => (
                        <TableRow key={feesMaster.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{feesMaster.fees_group}</div>
                              <div className="text-xs text-gray-500">{feesMaster.fees_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              Class {feesMaster.class}
                              {feesMaster.section && ` - ${feesMaster.section}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">${feesMaster.amount}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(feesMaster.due_date), 'dd/MM/yyyy')}
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
                                onClick={() => handleEdit(feesMaster)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(feesMaster.id)}
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