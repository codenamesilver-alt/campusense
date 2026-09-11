import { useState, useEffect } from 'react';
import { SMSTemplate } from '@/entities/SMSTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function SMSTemplatePage() {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setTemplates(await SMSTemplate.list());
  };

  const handleSave = async () => {
    if (currentTemplate.id) {
      await SMSTemplate.update(currentTemplate.id, currentTemplate);
    } else {
      await SMSTemplate.create(currentTemplate);
    }
    fetchTemplates();
    closeDialog();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this template?')) {
      await SMSTemplate.delete(id);
      fetchTemplates();
    }
  };

  const openDialog = (template = null) => {
    setCurrentTemplate(template || { name: '', body: '' });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => setIsDialogOpen(false);
  
  const handleTemplateChange = (field, value) => {
     setCurrentTemplate(prev => ({...prev, [field]: value}));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SMS Templates</h1>
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
            </CardHeader>
            <CardContent>
                <p className="text-sm p-4 bg-gray-100 rounded-md">{template.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentTemplate?.id ? 'Edit' : 'Create'} SMS Template</DialogTitle></DialogHeader>
          {currentTemplate && (
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" value={currentTemplate.name} onChange={(e) => handleTemplateChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="body">Message Body</Label>
                    <Textarea id="body" value={currentTemplate.body} onChange={(e) => handleTemplateChange('body', e.target.value)} maxLength="160" />
                    <p className="text-sm text-right text-gray-500">{currentTemplate.body.length} / 160 characters</p>
                </div>
                <p className="text-xs text-gray-500">You can use placeholders like {"{{student_name}}"}, {"{{class}}"}, {"{{due_date}}"} etc.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}