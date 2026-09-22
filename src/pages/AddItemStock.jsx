import { useState, useEffect } from 'react';
import { InventoryItem } from '@/entities/InventoryItem';
import { ItemCategory } from '@/entities/ItemCategory';
import { ItemSupplier } from '@/entities/ItemSupplier';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

export default function AddItemStock() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsData, categoriesData, suppliersData] = await Promise.all([
      InventoryItem.list('-created_date'),
      ItemCategory.list(),
      ItemSupplier.list()
    ]);
    
    setItems(itemsData);
    setCategories(categoriesData);
    setSuppliers(suppliersData);
  };

  const handleSave = async () => {
    const payload = {
      name: currentItem.name,
      category: currentItem.category,
      quantity: currentItem.quantity,
      unit: currentItem.unit,
      unit_price: currentItem.unit_price,
      status: currentItem.status
    };
    if (currentItem.id) {
      await InventoryItem.update(currentItem.id, payload);
    } else {
      await InventoryItem.create(payload);
    }
    fetchData();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await InventoryItem.delete(id);
      fetchData();
    }
  };

  const openDialog = (item = null) => {
    setCurrentItem(item || {
      name: '', category: '', unit: '', quantity: 0,
      unit_price: 0, minimum_stock: 0, description: '', status: 'active'
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => setIsDialogOpen(false);

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minimum_stock);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {getLowStockItems().length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle /> Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-2">The following items are running low on stock:</p>
            <div className="flex flex-wrap gap-2">
              {getLowStockItems().map(item => (
                <Badge key={item.id} variant="destructive">
                  {item.name} ({item.quantity} {item.unit})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div>
                      <span className={`font-medium ${item.quantity <= item.minimum_stock ? 'text-red-600' : 'text-green-600'}`}>
                        {item.quantity}
                      </span> {item.unit}
                      {item.quantity <= item.minimum_stock && (
                        <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>₹{item.unit_price}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={currentItem.category} 
                  onValueChange={(val) => setCurrentItem({ ...currentItem, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={currentItem.unit} 
                  onValueChange={(val) => setCurrentItem({ ...currentItem, unit: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="ltr">Liter</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Total Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price (₹)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={currentItem.unit_price}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_stock">Minimum Stock</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  value={currentItem.minimum_stock}
                  onChange={(e) => setCurrentItem({ ...currentItem, minimum_stock: parseInt(e.target.value) })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={currentItem.description}
                  onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}