import { useState, useEffect } from 'react';
import { EmailTemplate } from '@/entities/EmailTemplate';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function EmailTemplatePage() {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setTemplates(await EmailTemplate.list());
  };

  const handleSave = async () => {
    if (currentTemplate.id) {
      await EmailTemplate.update(currentTemplate.id, currentTemplate);
    } else {
      await EmailTemplate.create(currentTemplate);
    }
    fetchTemplates();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this template?')) {
      await EmailTemplate.delete(id);
      fetchTemplates();
    }
  };

  const openDialog = (template = null) => {
    setCurrentTemplate(template || { name: '', subject: '', body: '' });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);
  
  const handleTemplateChange = (field, value) => {
     setCurrentTemplate(prev => ({...prev, [field]: value}));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      <div className="space-y-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{template.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(template)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">Subject: {template.subject}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{currentTemplate?.id ? 'Edit' : 'Create'} Email Template</DialogTitle></DialogHeader>
          {currentTemplate && (
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" value={currentTemplate.name} onChange={(e) => handleTemplateChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={currentTemplate.subject} onChange={(e) => handleTemplateChange('subject', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Body</Label>
                    <ReactQuill theme="snow" value={currentTemplate.body} onChange={(val) => handleTemplateChange('body', val)} style={{ height: '250px', marginBottom: '40px' }} />
                </div>
            </div>
          )}
          <DialogFooter className="pt-8">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}