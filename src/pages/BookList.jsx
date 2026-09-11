import { useState, useEffect } from 'react';
import { Book } from '@/entities/Book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, BookOpen, Upload, Download } from 'lucide-react';
import { UploadFile, ExtractDataFromUploadedFile } from '@/integrations/Core';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', publisher: '', category: '',
    total_copies: 0, available_copies: 0, price: 0, publication_year: '', rack_number: '', status: 'active'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    let result = books;

    if (searchQuery) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.includes(searchQuery)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(book => book.category === categoryFilter);
    }

    setFilteredBooks(result);
  }, [searchQuery, categoryFilter, books]);

  const downloadTemplate = () => {
    const headers = 'title,author,isbn,publisher,category,total_copies,available_copies,price,publication_year,rack_number';
    const sampleData = '"Mathematics for Class 10","R.D. Sharma",9788193240106,"S. Chand Publishing",Textbook,50,45,450,2023,A-101';
    const csvContent = [headers, sampleData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'book_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              author: { type: "string" },
              isbn: { type: "string" },
              publisher: { type: "string" },
              category: { type: "string" },
              total_copies: { type: "string" },
              available_copies: { type: "string" },
              price: { type: "string" },
              publication_year: { type: "string" },
              rack_number: { type: "string" }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output) {
        let successCount = 0;
        
        for (const bookData of extractResult.output) {
          try {
            const processedData = {
              ...bookData,
              total_copies: parseInt(bookData.total_copies) || 0,
              available_copies: parseInt(bookData.available_copies) || 0,
              price: parseFloat(bookData.price) || 0,
              status: 'active'
            };
            
            await Book.create(processedData);
            successCount++;
          } catch (error) {
            console.error('Error importing book:', error);
          }
        }
        
        alert(`Successfully imported ${successCount} books`);
        fetchBooks();
      } else {
        alert('Failed to process CSV file');
      }
    } catch (error) {
      alert('Error importing books: ' + error.message);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const fetchBooks = async () => {
    const data = await Book.list('-created_date');
    setBooks(data);
    setFilteredBooks(data);
  };

  const handleSave = async () => {
    try {
      if (currentBook) {
        await Book.update(currentBook.id, formData);
      } else {
        await Book.create({ ...formData, status: 'active' });
      }
      fetchBooks();
      closeDialog();
    } catch (error) {
      console.error("Failed to save book:", error);
      alert(`Failed to save book: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await Book.delete(id);
        fetchBooks();
      } catch (error) {
        console.error("Failed to delete book:", error);
        alert(`Failed to delete book: ${error.message}`);
      }
    }
  };

  const openDialog = (book = null) => {
    if (book) {
      setCurrentBook(book);
      setFormData(book);
    } else {
      setCurrentBook(null);
      setFormData({
        title: '', author: '', isbn: '', publisher: '', category: '',
        total_copies: 0, available_copies: 0, price: 0, publication_year: '', rack_number: '', status: 'active'
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentBook(null);
  };

  const categories = [...new Set(books.map(book => book.category))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Library Books</h1>
        <div className="flex gap-2">
           <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
          <input
            type="file"
            id="import-csv"
            className="hidden"
            accept=".csv"
            onChange={handleImport}
            disabled={isImporting}
          />
          <Label htmlFor="import-csv">
            <Button asChild variant="outline">
              <div>
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </div>
            </Button>
          </Label>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Book
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search books by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Books ({filteredBooks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No books found. Add some books to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-500">by {book.author}</p>
                          <p className="text-xs text-gray-400">ISBN: {book.isbn}</p>
                        </div>
                      </TableCell>
                      <TableCell>{book.category}</TableCell>
                      <TableCell>{book.publisher}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Total: {book.total_copies}</p>
                          <p className="text-green-600">Available: {book.available_copies}</p>
                        </div>
                      </TableCell>
                      <TableCell>₹{book.price}</TableCell>
                      <TableCell>{book.rack_number}</TableCell>
                      <TableCell>
                        <Badge className={book.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {book.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDialog(book)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(book.id)}>
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

      {/* Book Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter book title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                placeholder="Enter author name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                placeholder="Enter ISBN number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                placeholder="Enter publisher name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Enter book category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_copies">Total Copies</Label>
              <Input
                id="total_copies"
                type="number"
                value={formData.total_copies}
                onChange={(e) => setFormData({...formData, total_copies: parseInt(e.target.value) || 0})}
                placeholder="Enter total copies"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available_copies">Available Copies</Label>
              <Input
                id="available_copies"
                type="number"
                value={formData.available_copies}
                onChange={(e) => setFormData({...formData, available_copies: parseInt(e.target.value) || 0})}
                placeholder="Enter available copies"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                placeholder="Enter book price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication_year">Publication Year</Label>
              <Input
                id="publication_year"
                value={formData.publication_year}
                onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                placeholder="Enter publication year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rack_number">Rack Number</Label>
              <Input
                id="rack_number"
                value={formData.rack_number}
                onChange={(e) => setFormData({...formData, rack_number: e.target.value})}
                placeholder="Enter rack location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}