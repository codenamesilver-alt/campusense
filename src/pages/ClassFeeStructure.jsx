import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, School, IndianRupee, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClassFeeStructurePage() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [formData, setFormData] = useState({
    class: '',
    section: 'all',
    fee_head_id: '',
    fee_head_name: '',
    amount: '',
    enabled: true,
    due_date: '',
    academic_year: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySource, setCopySource] = useState({ class: '', section: 'all' });
  const [copyTarget, setCopyTarget] = useState({ class: '', section: 'all' });

  useEffect(() => {
    const initialize = async () => {
      console.log('🔄 Initializing ClassFeeStructure page...');
      await initializeSession();
      await loadData();
    };
    initialize();
  }, []);

  const getCurrentSessionFromDB = async () => {
    try {
      console.log('🔍 Getting current session from database...');
      
      const sessions = await base44.entities.Session.list();
      console.log('📚 All sessions:', sessions);
      
      if (!sessions || sessions.length === 0) {
        console.warn('⚠️ No sessions found in database');
        return '2025-26';
      }
      
      const settings = await base44.entities.SchoolSetting.list();
      console.log('📋 SchoolSetting:', settings);
      
      if (settings && settings.length > 0 && settings[0].current_session_id) {
        const currentSession = sessions.find(s => s.id === settings[0].current_session_id);
        if (currentSession) {
          console.log('✅ Current session from settings:', currentSession.name);
          return currentSession.name;
        }
      }
      
      const currentSession = sessions.find(s => s.is_current === true);
      if (currentSession) {
        console.log('✅ Current session with is_current flag:', currentSession.name);
        return currentSession.name;
      }
      
      console.log('⚠️ Using first session as default:', sessions[0].name);
      return sessions[0].name;
    } catch (error) {
      console.error('❌ Error getting current session:', error);
      return '2025-26';
    }
  };

  const initializeSession = async () => {
    try {
      console.log('📅 Loading sessions...');
      const sessions = await base44.entities.Session.list();
      console.log('✅ Loaded sessions:', sessions);
      console.log('Session count:', sessions ? sessions.length : 0);
      
      const currentSession = await getCurrentSessionFromDB();
      console.log('✅ Current session:', currentSession);
      
      setAvailableSessions(sessions || []);
      setFormData(prev => ({ ...prev, academic_year: currentSession }));
      
      if (!sessions || sessions.length === 0) {
        console.error('⚠️ No sessions found! User needs to create sessions in General Settings');
      }
    } catch (error) {
      console.error('❌ Error initializing session:', error);
      console.error('Error details:', error.message);
    }
  };

  const loadData = async () => {
    try {
      console.log('📚 Loading fee structure data...');
      const [structuresData, headsData, classData, sectionData] = await Promise.all([
        base44.entities.ClassFeeStructure.list(),
        base44.entities.FeeHead.list(),
        base44.entities.Class.list(),
        base44.entities.Section.list()
      ]);
      
      console.log('Loaded:', {
        structures: structuresData.length,
        heads: headsData.length,
        classes: classData.length,
        sections: sectionData.length
      });
      
      setFeeStructures(structuresData);
      setFeeHeads(headsData);
      setClasses(classData);
      setSections(sectionData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeeHeadSelect = (feeHeadId) => {
    const selectedFeeHead = feeHeads.find(h => h.id === feeHeadId);
    if (selectedFeeHead) {
      setFormData(prev => ({
        ...prev,
        fee_head_id: feeHeadId,
        fee_head_name: selectedFeeHead.fee_head_name,
        due_date: '' // reset due date when fee head changes
      }));
    }
  };

  const getSelectedFeeHeadFrequency = () => {
    const feeHead = feeHeads.find(h => h.id === formData.fee_head_id);
    return feeHead?.frequency || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.class || !formData.fee_head_id || !formData.amount) {
      alert('Please fill all required fields');
      return;
    }

    if (!formData.academic_year) {
      alert('Please select an academic year. If no sessions are available, please create them in General Settings first.');
      return;
    }

    const selectedClass = classes.find(c => c.name === formData.class);
    const selectedSection = formData.section === 'all'
      ? null
      : sections.find(s => s.name === formData.section);
    const selectedHead = feeHeads.find(h => h.id === formData.fee_head_id);

    if (!selectedClass) {
      alert('Please select a valid class');
      return;
    }

    if (!selectedHead) {
      alert('Please select a valid fee head');
      return;
    }

    try {
      setIsLoading(true);
      
      const isMonthly = (selectedHead.frequency || 'once') === 'monthly';

      const submitData = {
        class_id: selectedClass.id,
        section_id: selectedSection ? selectedSection.id : null,
        fee_head_id: formData.fee_head_id,
        amount: parseFloat(formData.amount),
        frequency: selectedHead.frequency || 'once',
        academic_year: formData.academic_year,
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        due_date: isMonthly ? null : (formData.due_date || null)
      };
      
      console.log('Submitting fee structure:', submitData);
      
      if (editingId) {
        await base44.entities.ClassFeeStructure.update(editingId, submitData);
        alert('Fee structure updated successfully!');
      } else {
        await base44.entities.ClassFeeStructure.create(submitData);
        alert('Fee structure created successfully!');
      }
      
      const currentSession = await getCurrentSessionFromDB();
      setFormData({
        class: '',
        section: 'all',
        fee_head_id: '',
        fee_head_name: '',
        amount: '',
        enabled: true,
        due_date: '',
        academic_year: currentSession
      });
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      alert('Error saving fee structure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (structure) => {
    const editedClass = classes.find(c => c.id === structure.class_id);
    const editedSection = sections.find(s => s.id === structure.section_id);
    const editedHead = feeHeads.find(h => h.id === structure.fee_head_id);
    let dueDateValue = structure.due_date || '';
    if (dueDateValue && typeof dueDateValue === 'string' && dueDateValue.length > 10) {
      dueDateValue = dueDateValue.slice(0, 10);
    }
    setFormData({
      class: editedClass?.name || '',
      section: editedSection?.name || 'all',
      fee_head_id: structure.fee_head_id,
      fee_head_name: editedHead?.fee_head_name || editedHead?.name || '',
      amount: structure.amount ? structure.amount.toString() : '',
      enabled: structure.enabled !== undefined ? structure.enabled : true,
      due_date: dueDateValue,
      academic_year: structure.academic_year || ''
    });
    setEditingId(structure.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await base44.entities.ClassFeeStructure.delete(id);
        alert('Fee structure deleted successfully!');
        loadData();
      } catch (error) {
        console.error('Error deleting fee structure:', error);
        alert('Error deleting fee structure. Please try again.');
      }
    }
  };

  const handleCopyStructure = async () => {
    if (!copySource.class || !copyTarget.class) {
      alert('Please select both source and target classes');
      return;
    }

    const sourceSection = copySource.section === 'all' ? '' : copySource.section;
    const targetSection = copyTarget.section === 'all' ? '' : copyTarget.section;

    const sourceClassId = classes.find(c => c.name === copySource.class)?.id;
    const targetClassId = classes.find(c => c.name === copyTarget.class)?.id;
    const sourceSectionId = sourceSection ? sections.find(s => s.name === sourceSection)?.id : null;
    const targetSectionId = targetSection ? sections.find(s => s.name === targetSection)?.id : null;

    if (!sourceClassId || !targetClassId) {
      alert('Please select valid source and target classes');
      return;
    }

    try {
      setIsLoading(true);
      
      const sourceStructures = feeStructures.filter(s => 
        s.class_id === sourceClassId && 
        (copySource.section === 'all' || s.section_id === sourceSectionId)
      );

      if (sourceStructures.length === 0) {
        alert('No fee structures found for the source class/section');
        return;
      }

      for (const structure of sourceStructures) {
        const newStructure = {
          ...structure,
          class_id: targetClassId,
          section_id: copyTarget.section === 'all' ? structure.section_id : targetSectionId
        };
        delete newStructure.id;
        delete newStructure.created_date;
        delete newStructure.updated_date;
        
        await base44.entities.ClassFeeStructure.create(newStructure);
      }

      alert(`Successfully copied ${sourceStructures.length} fee structures!`);
      setShowCopyDialog(false);
      setCopySource({ class: '', section: 'all' });
      setCopyTarget({ class: '', section: 'all' });
      loadData();
    } catch (error) {
      console.error('Error copying fee structure:', error);
      alert('Error copying fee structure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = async () => {
    const currentSession = await getCurrentSessionFromDB();
    setFormData({
      class: '',
      section: 'all',
      fee_head_id: '',
      fee_head_name: '',
      amount: '',
      enabled: true,
      due_date: '',
      academic_year: currentSession
    });
    setEditingId(null);
  };

  const getClassName = (id) => classes.find(c => c.id === id)?.name || 'Unknown';
  const getSectionName = (id) => sections.find(s => s.id === id)?.name || '';
  const getFeeHeadName = (id) => feeHeads.find(h => h.id === id)?.fee_head_name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Class Fee Structure Assignment</h1>
          <p className="text-gray-500">Assign fee structures to classes and sections</p>
        </div>
        <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy Structure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Copy Fee Structure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Class</Label>
                  <Select value={copySource.class} onValueChange={(value) => setCopySource(prev => ({ ...prev, class: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source Section (Optional)</Label>
                  <Select value={copySource.section} onValueChange={(value) => setCopySource(prev => ({ ...prev, section: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(sec => (
                        <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Class</Label>
                  <Select value={copyTarget.class} onValueChange={(value) => setCopyTarget(prev => ({ ...prev, class: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Section (Optional)</Label>
                  <Select value={copyTarget.section} onValueChange={(value) => setCopyTarget(prev => ({ ...prev, section: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(sec => (
                        <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCopyStructure} disabled={isLoading}>
                  {isLoading ? 'Copying...' : 'Copy Structure'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {availableSessions.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Academic Sessions Found</AlertTitle>
          <AlertDescription>
            Please create academic sessions in Settings → General Settings → Academic Session Management before assigning fee structures.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                {editingId ? 'Edit Fee Structure' : 'Assign Fee Structure'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="class" className="text-sm font-medium">Class *</Label>
                    <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                      <SelectTrigger id="class" className="w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section" className="text-sm font-medium">Section</Label>
                    <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                      <SelectTrigger id="section" className="w-full">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sections.map(sec => (
                          <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_head_id" className="text-sm font-medium">Fee Head *</Label>
                  <Select value={formData.fee_head_id} onValueChange={handleFeeHeadSelect}>
                    <SelectTrigger id="fee_head_id" className="w-full">
                      <SelectValue placeholder="Select fee head" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeHeads.map(head => (
                        <SelectItem key={head.id} value={head.id}>
                          {head.fee_head_name || head.name} ({(head.frequency || 'once').replace('_', ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Amount (₹) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                {(() => {
                  const selectedFrequency = feeHeads.find(h => h.id === formData.fee_head_id)?.frequency || null;
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                      {selectedFrequency === 'monthly' ? (
                        <>
                          <Input
                            id="due_date"
                            type="number"
                            placeholder="e.g., 10 (for 10th of every month)"
                            value={formData.due_date}
                            onChange={(e) => handleInputChange('due_date', e.target.value)}
                            min="1"
                            max="31"
                          />
                          <p className="text-xs text-gray-500">Enter day of month (1–31)</p>
                        </>
                      ) : selectedFrequency ? (
                        <>
                          <Input
                            id="due_date"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => handleInputChange('due_date', e.target.value)}
                          />
                          <p className="text-xs text-gray-500">Select the specific due date</p>
                        </>
                      ) : (
                        <Input
                          id="due_date"
                          placeholder="Select a fee head first"
                          disabled
                        />
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <Label htmlFor="academic_year" className="text-sm font-medium">Academic Year *</Label>
                  <Select 
                    value={formData.academic_year} 
                    onValueChange={(value) => handleInputChange('academic_year', value)}
                  >
                    <SelectTrigger id="academic_year" className="w-full">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSessions.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No sessions available</div>
                      ) : (
                        availableSessions.map(session => (
                          <SelectItem key={session.id} value={session.name}>
                            {session.name} {session.is_current ? '(Current)' : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.academic_year && (
                    <p className="text-xs text-gray-500 mt-1">Selected: {formData.academic_year}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                  />
                  <Label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                    Enabled for this class
                  </Label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Saving...' : (editingId ? 'Update' : 'Assign')}
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
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Fee Structures ({feeStructures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class/Section</TableHead>
                      <TableHead>Fee Head</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No fee structures found. Create your first fee structure assignment.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeStructures.map((structure) => (
                        <TableRow key={structure.id}>
                          <TableCell>
                            <div className="font-medium">
                              Class {getClassName(structure.class_id)}
                              {getSectionName(structure.section_id) ? ` - ${getSectionName(structure.section_id)}` : ' - All Sections'}
                            </div>
                            <div className="text-sm text-gray-500">
                              AY: {structure.academic_year}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{getFeeHeadName(structure.fee_head_id)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">₹{structure.amount.toLocaleString('en-IN')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">
                              {structure.frequency || 'once'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={structure.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {structure.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(structure)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(structure.id)}
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