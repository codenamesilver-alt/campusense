import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Calendar, Search } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function IssueItem() {
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersons, setFilteredPersons] = useState([]);
  
  const [formData, setFormData] = useState({
    item_id: '',
    issued_to_id: '',
    issued_to_type: 'student',
    quantity: 1,
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    expected_return_date: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPersons();
  }, [searchTerm, formData.issued_to_type, students, staff]);

  const fetchData = async () => {
    const [itemsData, studentsData, staffData, issuesData] = await Promise.all([
      fetchAllFiltered('InventoryItem', { status: 'active' }),
      fetchAllFiltered('Student', { status: 'active' }),
      fetchAllFiltered('Staff', { status: 'active' }),
      base44.entities.ItemIssue.list('-created_date', 10)
    ]);
    
    setItems(itemsData.filter(item => item.available_quantity > 0));
    setStudents(studentsData);
    setStaff(staffData);
    setRecentIssues(issuesData);
  };

  const filterPersons = () => {
    const allPersons = formData.issued_to_type === 'student' ? students : staff;
    
    if (!searchTerm) {
      setFilteredPersons(allPersons);
      return;
    }

    const filtered = allPersons.filter(person => {
      const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      if (formData.issued_to_type === 'student') {
        return fullName.includes(searchLower) || 
               person.admission_number?.toLowerCase().includes(searchLower);
      } else {
        return fullName.includes(searchLower) || 
               person.staff_id?.toLowerCase().includes(searchLower);
      }
    });

    setFilteredPersons(filtered);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    
    try {
      const selectedItem = items.find(i => i.id === formData.item_id);
      const issuedTo = formData.issued_to_type === 'student' 
        ? students.find(s => s.id === formData.issued_to_id)
        : staff.find(s => s.id === formData.issued_to_id);

      if (selectedItem.available_quantity < formData.quantity) {
        alert('Insufficient quantity available!');
        return;
      }

      await base44.entities.ItemIssue.create({
        ...formData,
        issued_to_name: `${issuedTo.first_name} ${issuedTo.last_name}`,
        status: 'issued'
      });

      // Update item's available quantity
      await base44.entities.InventoryItem.update(selectedItem.id, {
        available_quantity: selectedItem.available_quantity - formData.quantity
      });

      alert('Item issued successfully!');
      setFormData({
        item_id: '',
        issued_to_id: '',
        issued_to_type: 'student',
        quantity: 1,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        expected_return_date: format(addDays(new Date(), 7), 'yyyy-MM-dd')
      });
      setSearchTerm('');
      
      fetchData();
    } catch (error) {
      console.error('Error issuing item:', error);
      alert('Error issuing item. Please try again.');
    }
  };

  const handleIssuedToTypeChange = (type) => {
    setFormData({ ...formData, issued_to_type: type, issued_to_id: '' });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Issue Inventory Item</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package /> Issue New Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issued_to_type">Issue To</Label>
                <Select 
                  value={formData.issued_to_type} 
                  onValueChange={handleIssuedToTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Box */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <Label className="font-semibold">
                  Search {formData.issued_to_type === 'student' ? 'Student' : 'Staff'}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search by name or ${formData.issued_to_type === 'student' ? 'admission number' : 'staff ID'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <p className="text-sm text-blue-700">
                    Found {filteredPersons.length} {formData.issued_to_type === 'student' ? 'student(s)' : 'staff member(s)'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issued_to_id">
                  Select {formData.issued_to_type === 'student' ? 'Student' : 'Staff Member'}
                </Label>
                <Select 
                  value={formData.issued_to_id} 
                  onValueChange={(val) => setFormData({ ...formData, issued_to_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPersons.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        {searchTerm 
                          ? `No ${formData.issued_to_type}s found matching "${searchTerm}"`
                          : `No ${formData.issued_to_type}s found`}
                      </div>
                    ) : (
                      filteredPersons.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {formData.issued_to_type === 'student' ? (
                            <>
                              {person.first_name} {person.last_name} - {person.admission_number}
                              {person.class && ` (${person.class}-${person.section})`}
                            </>
                          ) : (
                            <>
                              {person.first_name} {person.last_name} - {person.staff_id}
                              {person.designation && ` (${person.designation})`}
                            </>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_id">Select Item</Label>
                <Select 
                  value={formData.item_id} 
                  onValueChange={(val) => setFormData({ ...formData, item_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No items available</div>
                    ) : (
                      items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_name} (Available: {item.available_quantity} {item.unit})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_return_date">Expected Return</Label>
                  <Input
                    type="date"
                    value={formData.expected_return_date}
                    onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Issue Item
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar /> Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Return Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No recent item issues
                    </TableCell>
                  </TableRow>
                ) : (
                  recentIssues.map(issue => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{issue.issued_to_name}</p>
                          <p className="text-sm text-gray-500 capitalize">{issue.issued_to_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {items.find(i => i.id === issue.item_id)?.item_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{issue.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(issue.expected_return_date), 'dd MMM, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}