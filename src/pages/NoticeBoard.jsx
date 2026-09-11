import { useState, useEffect } from 'react';
import { Notice } from '@/entities/Notice';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Badge } from '@/components/ui/badge';

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([]);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const data = await Notice.list('-created_date');
    setNotices(data.sort((a,b) => b.pinned - a.pinned));
  };

  const handleSave = async () => {
    if (currentNotice.id) {
      await Notice.update(currentNotice.id, currentNotice);
    } else {
      await Notice.create({ ...currentNotice, status: 'published' });
    }
    fetchNotices();
    closeDialog();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      await Notice.delete(id);
      fetchNotices();
    }
  };
  
  const handleTogglePin = async (notice) => {
    await Notice.update(notice.id, { pinned: !notice.pinned });
    fetchNotices();
  };

  const openDialog = (notice = null) => {
    setCurrentNotice(notice || { title: '', content: '', category: 'general', target_audience: 'all', priority: 'medium', pinned: false, publish_date: format(new Date(), 'yyyy-MM-dd') });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);
  
  const handleNoticeChange = (field, value) => {
     setCurrentNotice(prev => ({...prev, [field]: value}));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notice Board</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map(notice => (
          <Card key={notice.id} className={`flex flex-col ${notice.pinned ? 'border-blue-500 border-2 shadow-lg' : 'shadow-md'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2 pr-2">{notice.title}</CardTitle>
                  <Badge variant="outline">{notice.category}</Badge>
              </div>
              <p className="text-sm text-gray-500">
                For: {notice.target_audience}
              </p>
            </CardHeader>
            <CardContent className="flex-grow">
              <div
                className="prose prose-sm dark:prose-invert max-h-40 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-between items-center">
                <p className="text-xs text-gray-500">
                    {format(new Date(notice.publish_date), 'dd MMM, yyyy')}
                </p>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleTogglePin(notice)} title={notice.pinned ? 'Unpin' : 'Pin'}>
                        {notice.pinned ? <PinOff className="h-4 w-4 text-blue-500" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDialog(notice)} title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{currentNotice?.id ? 'Edit' : 'Create'} Notice</DialogTitle></DialogHeader>
          {currentNotice && (
            <div className="space-y-4 py-4">
                <Input placeholder="Notice Title" value={currentNotice.title} onChange={(e) => handleNoticeChange('title', e.target.value)} />
                <ReactQuill theme="snow" value={currentNotice.content} onChange={(val) => handleNoticeChange('content', val)} style={{ height: '200px', marginBottom: '50px' }} />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={currentNotice.category} onValueChange={(val) => handleNoticeChange('category', val)}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="fee">Fee</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                  </Select>
                  <Select value={currentNotice.target_audience} onValueChange={(val) => handleNoticeChange('target_audience', val)}>
                      <SelectTrigger><SelectValue placeholder="Target Audience" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="parents">Parents</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="pinned" checked={currentNotice.pinned} onCheckedChange={(val) => handleNoticeChange('pinned', val)} />
                    <Label htmlFor="pinned">Pin this notice to the top</Label>
                </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}