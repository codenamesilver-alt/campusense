import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, BookOpen, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function IssueBook() {
  const [books, setBooks] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    book_id: '',
    borrower_id: '',
    borrower_type: 'student',
    borrower_name: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [selectedClass, selectedSection, searchTerm, allStudents]);

  const fetchData = async () => {
    const [booksData, studentsData, staffData, issuesData, classData, sectionData] = await Promise.all([
      fetchAllFiltered('Book', { status: 'active' }),
      fetchAllFiltered('Student', { status: 'active' }),
      fetchAllFiltered('Staff', { status: 'active' }),
      base44.entities.BookIssue.list('-created_date', 10),
      base44.entities.Class.list('numeric_value'),
      base44.entities.Section.list('name')
    ]);
    
    setBooks(booksData.filter(book => book.available_copies > 0));
    setAllStudents(studentsData);
    setStaff(staffData);
    setRecentIssues(issuesData);
    setClasses(classData);
    setSections(sectionData);
  };

  const filterStudents = () => {
    let filtered = allStudents;

    // Filter by class
    if (selectedClass) {
      filtered = filtered.filter(s => s.class === selectedClass);
    }

    // Filter by section
    if (selectedSection) {
      filtered = filtered.filter(s => s.section === selectedSection);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    
    try {
      const selectedBook = books.find(b => b.id === formData.book_id);
      let borrowerName = '';
      
      if (formData.borrower_type === 'student') {
        const borrower = allStudents.find(s => s.id === formData.borrower_id);
        borrowerName = `${borrower.first_name} ${borrower.last_name}`;
      } else {
        const borrower = staff.find(s => s.id === formData.borrower_id);
        borrowerName = `${borrower.first_name} ${borrower.last_name}`;
      }

      await base44.entities.BookIssue.create({
        ...formData,
        borrower_name: borrowerName,
        status: 'issued'
      });

      // Update book's available copies
      await base44.entities.Book.update(selectedBook.id, {
        available_copies: selectedBook.available_copies - 1
      });

      alert('Book issued successfully!');
      setFormData({
        book_id: '',
        borrower_id: '',
        borrower_type: 'student',
        borrower_name: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd')
      });
      
      // Reset filters
      setSelectedClass('');
      setSelectedSection('');
      setSearchTerm('');
      
      fetchData();
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Error issuing book. Please try again.');
    }
  };

  const handleBorrowerTypeChange = (type) => {
    setFormData({ 
      ...formData, 
      borrower_type: type, 
      borrower_id: '' 
    });
    // Reset filters when changing borrower type
    setSelectedClass('');
    setSelectedSection('');
    setSearchTerm('');
  };

  const borrowersToShow = formData.borrower_type === 'student' ? filteredStudents : staff;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Issue Book</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen /> Issue New Book
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="borrower_type">Borrower Type</Label>
                <Select 
                  value={formData.borrower_type} 
                  onValueChange={handleBorrowerTypeChange}
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

              {/* Student Filters - Only show for students */}
              {formData.borrower_type === 'student' && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <Label className="font-semibold">Filter Students</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>All Classes</SelectItem>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>All Sections</SelectItem>
                          {sections.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Search Student</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or admission number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {(selectedClass || selectedSection || searchTerm) && (
                    <p className="text-sm text-blue-700">
                      Showing {filteredStudents.length} student(s)
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="borrower_id">
                  Select {formData.borrower_type === 'student' ? 'Student' : 'Staff Member'}
                </Label>
                <Select 
                  value={formData.borrower_id} 
                  onValueChange={(val) => setFormData({ ...formData, borrower_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose ${formData.borrower_type}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {borrowersToShow.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        {formData.borrower_type === 'student' && (selectedClass || selectedSection || searchTerm)
                          ? 'No students found with current filters'
                          : `No ${formData.borrower_type}s found`}
                      </div>
                    ) : (
                      borrowersToShow.map(borrower => (
                        <SelectItem key={borrower.id} value={borrower.id}>
                          {formData.borrower_type === 'student' ? (
                            <>
                              {borrower.first_name} {borrower.last_name} - {borrower.admission_number} 
                              {borrower.class && ` (${borrower.class}-${borrower.section})`}
                            </>
                          ) : (
                            <>
                              {borrower.first_name} {borrower.last_name} - {borrower.staff_id}
                            </>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="book_id">Select Book</Label>
                <Select 
                  value={formData.book_id} 
                  onValueChange={(val) => setFormData({ ...formData, book_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose book..." />
                  </SelectTrigger>
                  <SelectContent>
                    {books.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No books available</div>
                    ) : (
                      books.map(book => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author} (Available: {book.available_copies})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Issue Book
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
                  <TableHead>Borrower</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      No recent book issues
                    </TableCell>
                  </TableRow>
                ) : (
                  recentIssues.map(issue => {
                    const book = books.find(b => b.id === issue.book_id);
                    return (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{issue.borrower_name}</p>
                            <p className="text-sm text-gray-500 capitalize">{issue.borrower_type}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {book?.title || 'Unknown Book'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(issue.due_date), 'dd MMM, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}