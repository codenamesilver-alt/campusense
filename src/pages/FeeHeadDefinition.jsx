import { useState, useEffect } from 'react';
import { FeeHead } from '@/entities/FeeHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, Percent } from 'lucide-react';

export default function FeeHeadDefinition() {
  const [feeHeads, setFeeHeads] = useState([]);
  const [formData, setFormData] = useState({
    fee_head_name: '',
    description: '',
    frequency: '',
    applicability: '',
    tax_applicable: false,
    tax_percentage: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFeeHeads();
  }, []);

  const loadFeeHeads = async () => {
    try {
      const data = await FeeHead.list('-created_date');
      setFeeHeads(data);
    } catch (error) {
      console.error('Error loading fee heads:', error);
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
    
    if (!formData.fee_head_name.trim() || !formData.frequency || !formData.applicability) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      const submitData = {
        ...formData,
        tax_percentage: formData.tax_applicable ? parseFloat(formData.tax_percentage) || 0 : 0
      };
      
      if (editingId) {
        await FeeHead.update(editingId, submitData);
        alert('Fee head updated successfully!');
      } else {
        await FeeHead.create(submitData);
        alert('Fee head created successfully!');
      }
      
      setFormData({
        fee_head_name: '',
        description: '',
        frequency: '',
        applicability: '',
        tax_applicable: false,
        tax_percentage: ''
      });
      setEditingId(null);
      loadFeeHeads();
    } catch (error) {
      console.error('Error saving fee head:', error);
      alert('Error saving fee head. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (feeHead) => {
    setFormData({
      fee_head_name: feeHead.fee_head_name,
      description: feeHead.description || '',
      frequency: feeHead.frequency,
      applicability: feeHead.applicability,
      tax_applicable: feeHead.tax_applicable || false,
      tax_percentage: feeHead.tax_percentage?.toString() || ''
    });
    setEditingId(feeHead.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee head? This may affect existing fee structures.')) {
      try {
        await FeeHead.delete(id);
        alert('Fee head deleted successfully!');
        loadFeeHeads();
      } catch (error) {
        console.error('Error deleting fee head:', error);
        alert('Error deleting fee head. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setFormData({
      fee_head_name: '',
      description: '',
      frequency: '',
      applicability: '',
      tax_applicable: false,
      tax_percentage: ''
    });
    setEditingId(null);
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      'one_time': 'bg-purple-100 text-purple-800',
      'monthly': 'bg-blue-100 text-blue-800',
      'quarterly': 'bg-green-100 text-green-800',
      'annually': 'bg-orange-100 text-orange-800',
      'per_term': 'bg-indigo-100 text-indigo-800'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-800';
  };

  const getApplicabilityBadge = (applicability) => {
    return applicability === 'compulsory' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fee Head Definition</h1>
          <p className="text-gray-500">Create and manage different types of fees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {editingId ? 'Edit Fee Head' : 'Create Fee Head'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fee_head_name">Fee Head Name *</Label>
                  <Input
                    id="fee_head_name"
                    placeholder="e.g., Admission Fee, Monthly Tuition"
                    value={formData.fee_head_name}
                    onChange={(e) => handleInputChange('fee_head_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this fee head"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="per_term">Per Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicability">Applicability *</Label>
                  <Select value={formData.applicability} onValueChange={(value) => handleInputChange('applicability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select applicability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compulsory">Compulsory</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tax_applicable"
                      checked={formData.tax_applicable}
                      onCheckedChange={(checked) => handleInputChange('tax_applicable', checked)}
                    />
                    <Label htmlFor="tax_applicable">Tax Applicable</Label>
                  </div>
                  
                  {formData.tax_applicable && (
                    <div className="space-y-2">
                      <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                      <Input
                        id="tax_percentage"
                        type="number"
                        placeholder="e.g., 18 for GST"
                        value={formData.tax_percentage}
                        onChange={(e) => handleInputChange('tax_percentage', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}
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

          {/* Quick Add Suggestions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Common Fee Heads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Admission Fee', freq: 'one_time', app: 'compulsory' },
                { name: 'Annual Fee', freq: 'annually', app: 'compulsory' },
                { name: 'Monthly Tuition', freq: 'monthly', app: 'compulsory' },
                { name: 'Exam Fee', freq: 'per_term', app: 'compulsory' },
                { name: 'Sports Fee', freq: 'annually', app: 'optional' },
                { name: 'Library Fee', freq: 'annually', app: 'optional' },
                { name: 'Lab Fee', freq: 'per_term', app: 'optional' },
                { name: 'Transport Fee', freq: 'monthly', app: 'optional' }
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleInputChange('fee_head_name', suggestion.name);
                    handleInputChange('frequency', suggestion.freq);
                    handleInputChange('applicability', suggestion.app);
                  }}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div>
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {suggestion.freq.replace('_', ' ')} • {suggestion.app}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Fee Heads List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Fee Heads ({feeHeads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Head</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Applicability</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeHeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No fee heads found. Create your first fee head to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeHeads.map((feeHead) => (
                        <TableRow key={feeHead.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{feeHead.fee_head_name}</div>
                              {feeHead.description && (
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {feeHead.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getFrequencyBadge(feeHead.frequency)}>
                              {feeHead.frequency.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getApplicabilityBadge(feeHead.applicability)}>
                              {feeHead.applicability.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {feeHead.tax_applicable ? (
                              <div className="flex items-center gap-1">
                                <Percent className="h-3 w-3 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  {feeHead.tax_percentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No Tax</span>
                            )}
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
                                onClick={() => handleEdit(feeHead)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(feeHead.id)}
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