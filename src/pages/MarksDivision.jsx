
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarksDivision() {
  const [divisions, setDivisions] = useState([
    { id: '1', name: 'Distinction', minPercentage: 75 },
    { id: '2', name: 'First Division', minPercentage: 60 },
    { id: '3', name: 'Second Division', minPercentage: 45 },
    { id: '4', name: 'Pass', minPercentage: 35 },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDivisionMinPercentage, setNewDivisionMinPercentage] = useState('');

  const handleSaveNewDivision = () => {
    if (!newDivisionName.trim() || newDivisionMinPercentage === '') {
      alert('Please fill in all fields.'); // Simple client-side validation
      return;
    }

    const percentage = parseFloat(newDivisionMinPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert('Minimum percentage must be a number between 0 and 100.');
      return;
    }

    // Check for duplicate name (case-insensitive)
    if (divisions.some(div => div.name.toLowerCase() === newDivisionName.trim().toLowerCase())) {
        alert('A division with this name already exists.');
        return;
    }

    const newDivision = {
      id: String(Date.now()), // Simple unique ID generation
      name: newDivisionName.trim(),
      minPercentage: percentage,
    };

    // Add new division and sort by minPercentage in descending order
    setDivisions(prevDivisions =>
      [...prevDivisions, newDivision].sort((a, b) => b.minPercentage - a.minPercentage)
    );

    // Reset form fields and hide form
    setNewDivisionName('');
    setNewDivisionMinPercentage('');
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    // Reset form fields and hide form
    setNewDivisionName('');
    setNewDivisionMinPercentage('');
    setShowAddForm(false);
  };

  const handleDeleteDivision = (id) => {
    if (window.confirm('Are you sure you want to delete this division?')) {
      setDivisions(prevDivisions => prevDivisions.filter(division => division.id !== id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Marks Divisions</h1>
        {!showAddForm && ( // Only show add button if the form is not currently open
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Division
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="border p-6 rounded-lg shadow-md bg-white space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Add New Division</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="divisionName" className="text-sm font-medium text-gray-700">Division Name</Label>
              <Input
                id="divisionName"
                value={newDivisionName}
                onChange={(e) => setNewDivisionName(e.target.value)}
                placeholder="e.g., Distinction, First Division"
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <Label htmlFor="minPercentage" className="text-sm font-medium text-gray-700">Minimum Percentage (%)</Label>
              <Input
                id="minPercentage"
                type="number"
                value={newDivisionMinPercentage}
                onChange={(e) => setNewDivisionMinPercentage(e.target.value)}
                placeholder="e.g., 75"
                min="0"
                max="100"
                className="mt-1 block w-full"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancelAdd}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSaveNewDivision}>
              <Save className="mr-2 h-4 w-4" /> Save Division
            </Button>
          </div>
        </div>
      )}

      {divisions.length === 0 && !showAddForm ? (
        // Display a friendly message when no divisions are defined and the form is not open
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-gray-50 text-gray-500">
          <Plus className="h-16 w-16 mb-4 text-gray-300" />
          <p className="text-xl font-medium mb-2">No marks divisions defined yet.</p>
          <p className="text-md">Click "Add New Division" to get started.</p>
        </div>
      ) : (
        // Display the table of divisions
        <div className="border rounded-lg overflow-hidden shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Division Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Min. Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {divisions.map((division) => (
                <tr key={division.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{division.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{division.minPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Edit functionality would typically involve opening an edit form/modal */}
                    <Button variant="ghost" size="sm" className="mr-2 text-blue-600 hover:bg-blue-50">Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteDivision(division.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
