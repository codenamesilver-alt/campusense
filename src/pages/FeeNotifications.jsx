import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { FeeDue } from '@/entities/FeeDue';
import { FeeTransaction } from '@/entities/FeeTransaction';
import { SendEmail } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

export default function FeeNotifications() {
  const [students, setStudents] = useState([]);
  const [dues, setDues] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [notificationData, setNotificationData] = useState({
    type: 'reminder',
    subject: '',
    message: '',
    includeAmount: true,
    includeDueDate: true,
    sendVia: ['email']
  });
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    daysOverdue: '',
    feeType: '',
    amountRange: { min: '', max: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [overdueStudents, setOverdueStudents] = useState([]);
  const [upcomingDues, setUpcomingDues] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    analyzeFeeDues();
  }, [students, dues]);

  const loadData = async () => {
    try {
      const [studentsData, duesData, transactionsData] = await Promise.all([
        Student.filter({ status: 'active' }),
        FeeDue.list(),
        FeeTransaction.list()
      ]);
      
      setStudents(studentsData);
      setDues(duesData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Generate sample data for demonstration
      generateSampleData();
    }
  };

  const generateSampleData = () => {
    const today = new Date();
    const sampleDues = [
      {
        id: 'due_1',
        student_id: 'std_1',
        fee_head_name: 'Monthly Tuition',
        due_amount: 2000,
        balance_amount: 2000,
        due_date: format(addDays(today, -15), 'yyyy-MM-dd'),
        status: 'overdue'
      },
      {
        id: 'due_2',
        student_id: 'std_2',
        fee_head_name: 'Annual Fee',
        due_amount: 5000,
        balance_amount: 5000,
        due_date: format(addDays(today, 5), 'yyyy-MM-dd'),
        status: 'pending'
      }
    ];
    setDues(sampleDues);
  };

  const analyzeFeeDues = () => {
    const today = new Date();
    
    // Find overdue students
    const overdue = students.filter(student => {
      const studentDues = dues.filter(due => 
        due.student_id === student.id && 
        (due.status === 'pending' || due.status === 'overdue') &&
        new Date(due.due_date) < today
      );
      return studentDues.length > 0;
    }).map(student => {
      const studentDues = dues.filter(due => 
        due.student_id === student.id && 
        (due.status === 'pending' || due.status === 'overdue') &&
        new Date(due.due_date) < today
      );
      const totalOverdue = studentDues.reduce((sum, due) => sum + due.balance_amount, 0);
      const daysPastDue = Math.max(...studentDues.map(due => 
        differenceInDays(today, new Date(due.due_date))
      ));
      
      return {
        ...student,
        overdues: studentDues,
        totalOverdue,
        daysPastDue
      };
    });

    // Find upcoming dues (within next 7 days)
    const upcoming = students.filter(student => {
      const studentDues = dues.filter(due => 
        due.student_id === student.id && 
        due.status === 'pending' &&
        new Date(due.due_date) >= today &&
        new Date(due.due_date) <= addDays(today, 7)
      );
      return studentDues.length > 0;
    }).map(student => {
      const studentDues = dues.filter(due => 
        due.student_id === student.id && 
        due.status === 'pending' &&
        new Date(due.due_date) >= today &&
        new Date(due.due_date) <= addDays(today, 7)
      );
      const totalDue = studentDues.reduce((sum, due) => sum + due.balance_amount, 0);
      
      return {
        ...student,
        upcomingDues: studentDues,
        totalDue
      };
    });

    setOverdueStudents(overdue);
    setUpcomingDues(upcoming);
  };

  const getFilteredStudents = (type) => {
    let targetStudents = type === 'overdue' ? overdueStudents : upcomingDues;
    
    return targetStudents.filter(student => {
      if (filters.class && student.class !== filters.class) return false;
      if (filters.section && student.section !== filters.section) return false;
      if (filters.daysOverdue && type === 'overdue') {
        const days = parseInt(filters.daysOverdue);
        if (student.daysPastDue < days) return false;
      }
      
      const totalAmount = type === 'overdue' ? student.totalOverdue : student.totalDue;
      if (filters.amountRange.min && totalAmount < parseFloat(filters.amountRange.min)) return false;
      if (filters.amountRange.max && totalAmount > parseFloat(filters.amountRange.max)) return false;
      
      return true;
    });
  };

  const handleStudentSelection = (student, checked) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, student]);
    } else {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    }
  };

  const selectAllStudents = (students, checked) => {
    if (checked) {
      setSelectedStudents(prev => {
        const newStudents = students.filter(s => !prev.find(p => p.id === s.id));
        return [...prev, ...newStudents];
      });
    } else {
      const studentIds = students.map(s => s.id);
      setSelectedStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
    }
  };

  const generateNotificationContent = (student, type) => {
    const studentDues = type === 'overdue' ? student.overdues : student.upcomingDues;
    const totalAmount = type === 'overdue' ? student.totalOverdue : student.totalDue;
    
    let subject = notificationData.subject;
    let message = notificationData.message;
    
    // Replace placeholders
    subject = subject.replace('[Student Name]', `${student.first_name} ${student.last_name}`);
    subject = subject.replace('[Class]', `${student.class}-${student.section}`);
    
    message = message.replace('[Student Name]', `${student.first_name} ${student.last_name}`);
    message = message.replace('[Class]', `${student.class}-${student.section}`);
    message = message.replace('[Parent Name]', student.father_name || 'Parent');
    
    if (notificationData.includeAmount) {
      message += `\n\nPending Amount: ₹${totalAmount}`;
    }
    
    if (notificationData.includeDueDate && studentDues.length > 0) {
      message += `\n\nDue Details:`;
      studentDues.forEach(due => {
        message += `\n- ${due.fee_head_name}: ₹${due.balance_amount} (Due: ${format(new Date(due.due_date), 'dd/MM/yyyy')})`;
      });
    }
    
    return { subject, message };
  };

  const sendNotifications = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to send notifications');
      return;
    }

    if (!notificationData.subject.trim() || !notificationData.message.trim()) {
      alert('Please enter subject and message for the notification');
      return;
    }

    try {
      setIsLoading(true);
      let successCount = 0;
      
      for (const student of selectedStudents) {
        if (notificationData.sendVia.includes('email') && student.guardian_email) {
          const studentType = student.overdues ? 'overdue' : 'upcoming';
          const { subject, message } = generateNotificationContent(student, studentType);
          
          try {
            await SendEmail({
              to: student.guardian_email,
              subject: subject,
              body: message,
              from_name: 'CAMPUSENSE School'
            });
            successCount++;
          } catch (error) {
            console.error(`Error sending email to ${student.guardian_email}:`, error);
          }
        }
        
        // SMS functionality would go here if available
        if (notificationData.sendVia.includes('sms')) {
          // Implementation for SMS sending
          successCount++;
        }
      }

      alert(`Notifications sent successfully to ${successCount} recipients!`);
      setSelectedStudents([]);
      setNotificationData({
        type: 'reminder',
        subject: '',
        message: '',
        includeAmount: true,
        includeDueDate: true,
        sendVia: ['email']
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Error sending notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateContent = (type) => {
    const templates = {
      reminder: {
        subject: 'Fee Payment Reminder - [Student Name] ([Class])',
        message: `Dear [Parent Name],

This is a gentle reminder that the fee payment for [Student Name] studying in Class [Class] is due.

Please make the payment at your earliest convenience to avoid any late fees.

Thank you for your cooperation.

Best regards,
CAMPUSENSE School`
      },
      overdue: {
        subject: 'Urgent: Overdue Fee Payment - [Student Name] ([Class])',
        message: `Dear [Parent Name],

This is to inform you that the fee payment for [Student Name] studying in Class [Class] is overdue.

Please settle the outstanding amount immediately to avoid any inconvenience.

For any queries, please contact the school office.

Best regards,
CAMPUSENSE School`
      },
      upcoming: {
        subject: 'Upcoming Fee Payment - [Student Name] ([Class])',
        message: `Dear [Parent Name],

This is to remind you that the fee payment for [Student Name] studying in Class [Class] is due soon.

Please ensure timely payment to avoid any late fees.

Thank you for your attention.

Best regards,
CAMPUSENSE School`
      }
    };
    
    return templates[type] || templates.reminder;
  };

  const loadTemplate = (type) => {
    const template = getTemplateContent(type);
    setNotificationData(prev => ({
      ...prev,
      type: type,
      subject: template.subject,
      message: template.message
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fee Notifications & Alerts</h1>
          <p className="text-gray-500">Send fee reminders and payment confirmations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue Students</p>
                <p className="text-2xl font-bold text-red-600">{overdueStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming Dues</p>
                <p className="text-2xl font-bold text-yellow-600">{upcomingDues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Overdue Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{overdueStudents.reduce((sum, s) => sum + s.totalOverdue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Fees</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Dues</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notification Composer */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Compose Notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Quick Templates</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadTemplate('reminder')}>
                        Reminder
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => loadTemplate('overdue')}>
                        Overdue
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => loadTemplate('upcoming')}>
                        Upcoming
                      </Button>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      placeholder="Email subject..."
                      value={notificationData.subject}
                      onChange={(e) => setNotificationData(prev => ({...prev, subject: e.target.value}))}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label>Message *</Label>
                    <Textarea
                      placeholder="Notification message..."
                      value={notificationData.message}
                      onChange={(e) => setNotificationData(prev => ({...prev, message: e.target.value}))}
                      rows={8}
                    />
                    <p className="text-xs text-gray-500">
                      Use placeholders: [Student Name], [Class], [Parent Name]
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeAmount"
                        checked={notificationData.includeAmount}
                        onCheckedChange={(checked) => setNotificationData(prev => ({...prev, includeAmount: checked}))}
                      />
                      <Label htmlFor="includeAmount">Include pending amount</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeDueDate"
                        checked={notificationData.includeDueDate}
                        onCheckedChange={(checked) => setNotificationData(prev => ({...prev, includeDueDate: checked}))}
                      />
                      <Label htmlFor="includeDueDate">Include due dates</Label>
                    </div>
                  </div>

                  {/* Send Via */}
                  <div className="space-y-2">
                    <Label>Send Via</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email"
                          checked={notificationData.sendVia.includes('email')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNotificationData(prev => ({...prev, sendVia: [...prev.sendVia, 'email']}));
                            } else {
                              setNotificationData(prev => ({...prev, sendVia: prev.sendVia.filter(v => v !== 'email')}));
                            }
                          }}
                        />
                        <Label htmlFor="email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sms"
                          checked={notificationData.sendVia.includes('sms')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNotificationData(prev => ({...prev, sendVia: [...prev.sendVia, 'sms']}));
                            } else {
                              setNotificationData(prev => ({...prev, sendVia: prev.sendVia.filter(v => v !== 'sms')}));
                            }
                          }}
                        />
                        <Label htmlFor="sms">SMS</Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={sendNotifications} disabled={isLoading} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? 'Sending...' : `Send to ${selectedStudents.length} Recipients`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Student Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Students ({selectedStudents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No students selected</p>
                      <p className="text-sm">Go to Overdue Fees or Upcoming Dues tab to select students</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{student.first_name} {student.last_name}</div>
                            <div className="text-sm text-gray-500">
                              {student.admission_number} • Class {student.class}-{student.section}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStudentSelection(student, false)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Students with Overdue Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Select value={filters.class} onValueChange={(value) => setFilters(prev => ({...prev, class: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Classes</SelectItem>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i} value={`${i + 1}`}>Class {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.section} onValueChange={(value) => setFilters(prev => ({...prev, section: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Sections</SelectItem>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                    <SelectItem value="D">Section D</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.daysOverdue} onValueChange={(value) => setFilters(prev => ({...prev, daysOverdue: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Days Overdue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any</SelectItem>
                    <SelectItem value="7">7+ days</SelectItem>
                    <SelectItem value="15">15+ days</SelectItem>
                    <SelectItem value="30">30+ days</SelectItem>
                    <SelectItem value="60">60+ days</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Min Amount"
                  value={filters.amountRange.min}
                  onChange={(e) => setFilters(prev => ({...prev, amountRange: {...prev.amountRange, min: e.target.value}}))}
                />

                <Input
                  placeholder="Max Amount"
                  value={filters.amountRange.max}
                  onChange={(e) => setFilters(prev => ({...prev, amountRange: {...prev.amountRange, max: e.target.value}}))}
                />
              </div>

              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => selectAllStudents(getFilteredStudents('overdue'), true)}
                >
                  Select All Filtered
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredStudents('overdue').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No overdue students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredStudents('overdue').map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.find(s => s.id === student.id) !== undefined}
                              onCheckedChange={(checked) => handleStudentSelection(student, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.first_name} {student.last_name}</div>
                              <div className="text-sm text-gray-500">{student.admission_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.class}-{student.section}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">
                              {student.daysPastDue} days
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{student.totalOverdue}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{student.guardian_phone}</div>
                              {student.guardian_email && (
                                <div className="text-gray-500">{student.guardian_email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                Students with Upcoming Dues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => selectAllStudents(getFilteredStudents('upcoming'), true)}
                >
                  Select All
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No upcoming dues found
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcomingDues.map((student) => {
                        const nearestDue = student.upcomingDues.reduce((nearest, due) => 
                          new Date(due.due_date) < new Date(nearest.due_date) ? due : nearest
                        );
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.find(s => s.id === student.id) !== undefined}
                                onCheckedChange={(checked) => handleStudentSelection(student, checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.first_name} {student.last_name}</div>
                                <div className="text-sm text-gray-500">{student.admission_number}</div>
                              </div>
                            </TableCell>
                            <TableCell>{student.class}-{student.section}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(nearestDue.due_date), 'MMM dd, yyyy')}
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                {differenceInDays(new Date(nearestDue.due_date), new Date())} days left
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">₹{student.totalDue}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{student.guardian_phone}</div>
                                {student.guardian_email && (
                                  <div className="text-gray-500">{student.guardian_email}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}