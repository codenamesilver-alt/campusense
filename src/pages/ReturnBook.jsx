import { useState, useEffect } from 'react';
import { Book } from '@/entities/Book';
import { BookIssue } from '@/entities/BookIssue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ReturnBook() {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  useEffect(() => {
    let result = issuedBooks;
    
    if (searchQuery) {
      result = result.filter(issue =>
        issue.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.borrower_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredBooks(result);
  }, [searchQuery, issuedBooks]);

  const fetchIssuedBooks = async () => {
    const issues = await BookIssue.filter({ status: 'issued' });
    const books = await Book.list();
    
    const enrichedIssues = issues.map(issue => {
      const book = books.find(b => b.id === issue.book_id);
      const daysOverdue = differenceInDays(new Date(), new Date(issue.due_date));
      const fineAmount = daysOverdue > 0 ? daysOverdue * 2 : 0; // ₹2 per day fine
      
      return {
        ...issue,
        book_title: book?.title || 'Unknown',
        book_author: book?.author || 'Unknown',
        days_overdue: daysOverdue,
        fine_amount: fineAmount
      };
    });
    
    setIssuedBooks(enrichedIssues);
    setFilteredBooks(enrichedIssues);
  };

  const handleReturn = async (issue) => {
    try {
      const returnDate = format(new Date(), 'yyyy-MM-dd');
      
      // Update the book issue record
      await BookIssue.update(issue.id, {
        return_date: returnDate,
        status: 'returned',
        fine_amount: issue.fine_amount
      });

      // Update the book's available copies
      const book = await Book.filter({ id: issue.book_id });
      if (book.length > 0) {
        await Book.update(issue.book_id, {
          available_copies: book[0].available_copies + 1
        });
      }

      alert(`Book returned successfully! ${issue.fine_amount > 0 ? `Fine: ₹${issue.fine_amount}` : ''}`);
      fetchIssuedBooks();
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Error processing return. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Return Book</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen /> Issued Books
          </CardTitle>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by borrower name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map(issue => (
                <TableRow key={issue.id} className={issue.days_overdue > 0 ? 'bg-red-50' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.book_title}</p>
                      <p className="text-sm text-gray-500">by {issue.book_author}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.borrower_name}</p>
                      <p className="text-sm text-gray-500">{issue.borrower_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(issue.issue_date), 'dd MMM, yyyy')}</TableCell>
                  <TableCell>{format(new Date(issue.due_date), 'dd MMM, yyyy')}</TableCell>
                  <TableCell>
                    {issue.fine_amount > 0 ? (
                      <span className="text-red-600 font-medium">₹{issue.fine_amount}</span>
                    ) : (
                      <span className="text-green-600">₹0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {issue.days_overdue > 0 ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue ({issue.days_overdue} days)
                      </Badge>
                    ) : (
                      <Badge variant="default">On Time</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleReturn(issue)}
                      size="sm"
                    >
                      Return Book
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}