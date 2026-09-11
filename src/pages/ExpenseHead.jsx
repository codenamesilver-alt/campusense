import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Search } from 'lucide-react';

export default function ExpenseHead() {
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [filteredHeads, setFilteredHeads] = useState([]);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', status: 'active' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadHeads();
  }, []);

  useEffect(() => {
    filterHeads();
  }, [expenseHeads, searchTerm, filterStatus]);

  const loadHeads = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.ExpenseHead.list('-created_date');
      setExpenseHeads(data);
    } catch (error) {
      console.error('Error loading expense heads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHeads = () => {
    let filtered = expenseHeads;
    if (searchTerm) {
      filtered = filtered.filter(head => head.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(head => head.status === filterStatus);
    }
    setFilteredHeads(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Head name is required.');
      return;
    }

    try {
      if (formData.id) {
        await base44.entities.ExpenseHead.update(formData.id, {
          name: formData.name,
          description: formData.description,
          status: formData.status
        });
        alert('Expense head updated successfully!');
      } else {
        await base44.entities.ExpenseHead.create(formData);
        alert('Expense head created successfully!');
      }
      resetForm();
      loadHeads();
    } catch (error) {
      console.error('Error saving expense head:', error);
      alert('Failed to save expense head.');
    }
  };

  const handleEdit = (head) => {
    setFormData({
      id: head.id,
      name: head.name,
      description: head.description,
      status: head.status
    });
  };

  const handleDelete = async (headId) => {
    if (window.confirm('Are you sure you want to delete this expense head?')) {
      try {
        await base44.entities.ExpenseHead.delete(headId);
        alert('Expense head deleted successfully!');
        loadHeads();
      } catch (error) {
        console.error('Error deleting expense head:', error);
        alert('Failed to delete expense head.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', description: '', status: 'active' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create/Edit Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{formData.id ? 'Edit Expense Head' : 'Create Expense Head'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Head Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{formData.id ? 'Update' : 'Create'}</Button>
                {formData.id && (
                  <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* List of Heads */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Head Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHeads.map(head => (
                  <TableRow key={head.id}>
                    <TableCell className="font-medium">{head.name}</TableCell>
                    <TableCell>{head.description}</TableCell>
                    <TableCell>
                      <Badge className={head.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {head.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(head)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(head.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}