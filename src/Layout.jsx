import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home, Users, DollarSign, TrendingUp, TrendingDown,
  BookOpen, Calendar, UserCheck, GraduationCap,
  MessageSquare, Download, FileText, Library,
  Package, BarChart3, Bus, Award, Settings,
  Menu, X, ChevronDown, ChevronRight, Sparkles, Bug, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionProvider, usePermissions, usePermission } from "@/components/auth/PermissionProvider";
import { useAuth } from "@/lib/AuthContext";

const allNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
    hasSubmenu: false,
    requiredPermission: null // Dashboard is accessible to all
  },
  {
    title: "Front Office",
    icon: Users,
    hasSubmenu: true,
    requiredPermission: "frontoffice:access",
    submenu: [
      { title: "Admission Enquiry", url: createPageUrl("AdmissionEnquiry"), requiredPermission: "admission:read" },
      { title: "Complaints", url: createPageUrl("Complaints"), requiredPermission: "complaints:read" }
    ]
  },
  {
    title: "Student Information",
    icon: Users,
    hasSubmenu: true,
    requiredPermission: "student:read",
    submenu: [
      { title: "Student Details", url: createPageUrl("StudentDetails"), requiredPermission: "student:read" },
      { title: "Student Admission", url: createPageUrl("StudentAdmission"), requiredPermission: "student:create" },
      { title: "Disable Student", url: createPageUrl("DisableStudent"), requiredPermission: "student:update" },
      { title: "Re-Enable Student", url: createPageUrl("ReEnableStudent"), requiredPermission: "student:update" },
      { title: "Bulk Delete Student", url: createPageUrl("BulkDeleteStudent"), requiredPermission: "student:delete" },
      { title: "Student House", url: createPageUrl("StudentHouse"), requiredPermission: "student:update" },
      { title: "Export Student", url: createPageUrl("ExportStudent"), requiredPermission: "student:read" },
      { title: "Import Student", url: createPageUrl("ImportStudent"), requiredPermission: "student:create" },
      { title: "Transfer Student", url: createPageUrl("TransferStudent"), requiredPermission: "student:update" },
      { title: "Disabled/Deleted", url: createPageUrl("DisabledDeletedStudent"), requiredPermission: "student:read" }
    ]
  },
  {
    title: "Fees Management",
    icon: DollarSign,
    hasSubmenu: true,
    requiredPermission: "fees:read",
    submenu: [
      { title: "Fee Head Definition", url: createPageUrl("FeeHeadDefinition"), requiredPermission: "fees:setup" },
      { title: "Class Fee Structure", url: createPageUrl("ClassFeeStructure"), requiredPermission: "fees:setup" },
      { title: "Student Fee Mapping", url: createPageUrl("StudentFeeMapping"), requiredPermission: "fees:setup" },
      { title: "Discount Management", url: createPageUrl("DiscountManagement"), requiredPermission: "fees:setup" },
      { title: "Fee Collection", url: createPageUrl("FeeCollection"), requiredPermission: "fees:collect" },
      { title: "Fee Reports", url: createPageUrl("FeeReports"), requiredPermission: "fees:reports" },
      { title: "Fee Notifications", url: createPageUrl("FeeNotifications"), requiredPermission: "fees:setup" }
    ]
  },
  {
    title: "Income & Expense",
    icon: TrendingUp,
    hasSubmenu: true,
    requiredPermission: "finance:read",
    submenu: [
      { title: "Finance Dashboard", url: createPageUrl("FinanceDashboard"), requiredPermission: "finance:read" },
      { title: "Income Head", url: createPageUrl("IncomeHead"), requiredPermission: "finance:setup" },
      { title: "Add Income", url: createPageUrl("AddIncome"), requiredPermission: "finance:create" },
      { title: "Search Income", url: createPageUrl("SearchIncome"), requiredPermission: "finance:read" },
      { title: "Expense Head", url: createPageUrl("ExpenseHead"), requiredPermission: "finance:setup" },
      { title: "Add Expense", url: createPageUrl("AddExpense"), requiredPermission: "finance:create" },
      { title: "Search Expense", url: createPageUrl("SearchExpense"), requiredPermission: "finance:read" }
    ]
  },
  {
    title: "Examination",
    icon: BookOpen,
    hasSubmenu: true,
    requiredPermission: "exam:read",
    submenu: [
      { title: "Exam Group", url: createPageUrl("ExamGroup"), requiredPermission: "exam:schedule" },
      { title: "Exam Schedule", url: createPageUrl("ExamSchedule"), requiredPermission: "exam:schedule" },
      { title: "Marks Entry", url: createPageUrl("MarksEntry"), requiredPermission: "exam:results" },
      { title: "Report Card", url: createPageUrl("ReportCard"), requiredPermission: "exam:results" },
      { title: "Admit Card Designer", url: createPageUrl("AdmitCardDesigner"), requiredPermission: "exam:design" },
      { title: "Marks & Grades", url: createPageUrl("MarksGrades"), requiredPermission: "exam:results" },
      { title: "Marks Division Analysis", url: createPageUrl("MarksDivisionAnalysis"), requiredPermission: "exam:results" },
      { title: "ID Card Design", url: createPageUrl("IDCardDesign"), requiredPermission: "exam:design" },
      { title: "ID Card Print", url: createPageUrl("IDCardPrint"), requiredPermission: "exam:design" },
      { title: "Result Analysis", url: createPageUrl("ResultAnalysis"), requiredPermission: "exam:results" },
      { title: "Exam Insights", url: createPageUrl("ExamInsights"), requiredPermission: "exam:results" }
    ]
  },
  {
    title: "Student Attendance",
    icon: UserCheck,
    hasSubmenu: true,
    requiredPermission: "attendance:read",
    submenu: [
      { title: "Attendance", url: createPageUrl("Attendance"), requiredPermission: "attendance:mark" },
      { title: "Approve Leave", url: createPageUrl("ApproveLeave"), requiredPermission: "attendance:approve" },
      { title: "Attendance by Date", url: createPageUrl("AttendanceByDate"), requiredPermission: "attendance:read" }
    ]
  },
  {
    title: "Academics",
    icon: GraduationCap,
    hasSubmenu: true,
    requiredPermission: "academics:read",
    submenu: [
      { title: "School Calendar", url: createPageUrl("SchoolCalendar"), requiredPermission: "academics:read" },
      { title: "Class Timetable", url: createPageUrl("ClassTimetable"), requiredPermission: "academics:timetable" },
      { title: "Teachers Timetable", url: createPageUrl("TeachersTimetable"), requiredPermission: "academics:timetable" },
      { title: "Assign Class Teacher", url: createPageUrl("AssignClassTeacher"), requiredPermission: "academics:timetable" },
      { title: "Promote Student", url: createPageUrl("PromoteStudent"), requiredPermission: "academics:promote" },
      { title: "Subject Group", url: createPageUrl("SubjectGroup"), requiredPermission: "academics:subjects" },
      { title: "Create Class", url: createPageUrl("CreateClass"), requiredPermission: "academics:subjects" },
      { title: "Create Section", url: createPageUrl("CreateSection"), requiredPermission: "academics:subjects" }
    ]
  },
  {
    title: "Human Resource",
    icon: Users,
    hasSubmenu: true,
    requiredPermission: "hr:read",
    submenu: [
      { title: "Staff Directory", url: createPageUrl("StaffDirectory"), requiredPermission: "hr:read" },
      { title: "Add Staff", url: createPageUrl("AddStaff"), requiredPermission: "hr:create" },
      { title: "Staff Attendance", url: createPageUrl("StaffAttendance"), requiredPermission: "hr:attendance" },
      { title: "Payroll", url: createPageUrl("Payroll"), requiredPermission: "hr:payroll" },
      { title: "Leave Apply", url: createPageUrl("StaffLeaveApplication"), requiredPermission: "hr:leave" },
      { title: "Leave Approvals", url: createPageUrl("StaffLeaveApproval"), requiredPermission: "hr:leave_approve" },
      { title: "Leave Calendar", url: createPageUrl("StaffLeaveCalendar"), requiredPermission: "hr:leave" },
      { title: "Department", url: createPageUrl("Department"), requiredPermission: "hr:setup" },
      { title: "Designation", url: createPageUrl("Designation"), requiredPermission: "hr:setup" }
    ]
  },
  {
    title: "Communicate",
    icon: MessageSquare,
    hasSubmenu: true,
    requiredPermission: "communicate:access",
    submenu: [
      { title: "Notice Board", url: createPageUrl("NoticeBoard"), requiredPermission: "communicate:noticeboard" },
      { title: "Send Email", url: createPageUrl("SendEmail"), requiredPermission: "communicate:send" },
      { title: "Send SMS", url: createPageUrl("SendSMS"), requiredPermission: "communicate:send" },
      { title: "Send WhatsApp", url: createPageUrl("SendWhatsApp"), requiredPermission: "communicate:send" },
      { title: "Email Template", url: createPageUrl("EmailTemplate"), requiredPermission: "communicate:send" },
      { title: "SMSTemplate", url: createPageUrl("SMSTemplate"), requiredPermission: "communicate:send" },
      { title: "Communicate Settings", url: createPageUrl("CommunicateSettings"), requiredPermission: "settings:communicate" },
    ]
  },
  {
    title: "Library",
    icon: Library,
    hasSubmenu: true,
    requiredPermission: "library:read",
    submenu: [
      { title: "Book List", url: createPageUrl("BookList"), requiredPermission: "library:read" },
      { title: "Issue Book", url: createPageUrl("IssueBook"), requiredPermission: "library:issue" },
      { title: "Return Book", url: createPageUrl("ReturnBook"), requiredPermission: "library:issue" }
    ]
  },
  {
    title: "Inventory",
    icon: Package,
    hasSubmenu: true,
    requiredPermission: "inventory:read",
    submenu: [
      { title: "Issue Item", url: createPageUrl("IssueItem"), requiredPermission: "inventory:issue" },
      { title: "AddItemStock", url: createPageUrl("AddItemStock"), requiredPermission: "inventory:create" },
      { title: "Item Category", url: createPageUrl("ItemCategory"), requiredPermission: "inventory:setup" },
      { title: "Item Supplier", url: createPageUrl("ItemSupplier"), requiredPermission: "inventory:setup" }
    ]
  },
  {
    title: "Transport",
    icon: Bus,
    hasSubmenu: true,
    requiredPermission: "transport:read",
    submenu: [
      { title: "Routes", url: createPageUrl("Routes"), requiredPermission: "transport:read" },
      { title: "Vehicle", url: createPageUrl("Vehicle"), requiredPermission: "transport:read" },
      { title: "Assign Driver", url: createPageUrl("AssignDriver"), requiredPermission: "transport:setup" },
      { title: "Student Transport Fees", url: createPageUrl("StudentTransportFees"), requiredPermission: "transport:fees" }
    ]
  },
  {
    title: "Reports",
    icon: BarChart3,
    hasSubmenu: false,
    url: createPageUrl("Reports"),
    requiredPermission: "reports:read"
  },
  {
    title: "Settings",
    icon: Settings,
    hasSubmenu: true,
    requiredPermission: "settings:access",
    submenu: [
      { title: "General Settings", url: createPageUrl("GeneralSettings"), requiredPermission: "settings:general" },
      { title: "Admin Approvals", url: createPageUrl("AdminApprovals"), requiredPermission: "settings:general" },
      { title: "Backup & Restore", url: createPageUrl("BackupAndRestore"), requiredPermission: "settings:general" },
      { title: "Report Card Settings", url: createPageUrl("ReportCardSettings"), requiredPermission: "settings:general" },
      { title: "Notification Settings", url: createPageUrl("NotificationSettings"), requiredPermission: "settings:notifications" },
      { title: "Payment Settings", url: createPageUrl("PaymentSettings"), requiredPermission: "settings:payments" },
      { title: "Leave System", url: createPageUrl("LeaveManagementSettings"), requiredPermission: "settings:general" },
      { title: "Manage Users", url: createPageUrl("Users"), requiredPermission: "settings:roles" },
      { title: "Roles & Permission", url: createPageUrl("RolesPermission"), requiredPermission: "settings:roles" }
    ]
  },
  {
    title: "Data Debug",
    url: createPageUrl("DataDebug"),
    icon: Bug,
    hasSubmenu: false,
    requiredPermission: "admin:all"
  }
];

const NavigationContent = () => {
  const { user, permissions, loading, isAdmin } = usePermissions();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [staffDesignation, setStaffDesignation] = useState('');
  const location = useLocation();

  // Fetch staff designation for current user
  React.useEffect(() => {
    if (user?.email) {
      const fetchStaffDesignation = async () => {
        try {
          const { base44 } = await import('@/api/base44Client');
          const staffRecords = await base44.entities.Staff.filter({ email: user.email });
          if (staffRecords.length > 0) {
            setStaffDesignation(staffRecords[0].designation || '');
          }
        } catch (error) {
          console.error('Error fetching staff designation:', error);
        }
      };
      fetchStaffDesignation();
    }
  }, [user?.email]);

  // Local hasPermission check using stable dependencies
  const checkPermission = (permission) => {
    if (isAdmin) return true;
    return permissions.includes(permission) || permissions.includes('admin:all');
  };

  // Memoize navigation items using stable dependencies
  const navigationItems = React.useMemo(() => {
    // While loading, return empty to prevent flash
    if (loading) return [];
    
    return allNavigationItems.filter(item => {
      if (!item.requiredPermission) return true;
      if (isAdmin) return true;
      return permissions.includes(item.requiredPermission) || permissions.includes('admin:all');
    }).map(item => ({
      ...item,
      submenu: item.submenu?.filter(subItem => {
        if (!subItem.requiredPermission) return true;
        if (isAdmin) return true;
        return permissions.includes(subItem.requiredPermission) || permissions.includes('admin:all');
      }) || []
    }));
  }, [loading, isAdmin, permissions]);

  useEffect(() => {
    // Auto-expand the current menu on page load
    const currentPath = location.pathname;
    const parentIndex = navigationItems.findIndex(item =>
      item.hasSubmenu && item.submenu.some(sub => sub.url === currentPath)
    );
    if (parentIndex !== -1) {
      setExpandedMenus(prev => ({ ...prev, [parentIndex]: true }));
    }
  }, [location.pathname, navigationItems]);

  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col shadow-2xl`} style={{ background: '#0a0e1a', borderRight: '1px solid rgba(0,245,255,0.1)' }}>

        <div className="p-6 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)', background: 'rgba(0,245,255,0.03)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,245,255,0.3)', boxShadow: '0 0 16px rgba(0,245,255,0.15)' }}>
              <img src="https://media.base44.com/images/public/69d01c04452ce0c0137e7371/6eb862abe_generated_image.png" alt="Campusense Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono" style={{ color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.5)' }}>CAMPUSENSE</h2>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>Smart Education Platform</p>
            </div>
            <Button variant="ghost" size="icon" onClick={closeSidebar} className="lg:hidden ml-auto" style={{ color: '#00f5ff' }}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {user && (
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,245,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-sm font-mono font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}</p>
            <p className="text-xs font-mono capitalize" style={{ color: '#a855f7' }}>{user.role}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full mx-auto mb-2" style={{ borderColor: 'rgba(0,245,255,0.3)', borderTopColor: 'transparent' }}></div>
              <p className="text-sm font-mono" style={{ color: 'rgba(0,245,255,0.5)' }}>LOADING...</p>
            </div>
          ) : navigationItems.map((item, index) => (
            <div key={index} className="mb-1 px-4">
              {item.hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(index)}
                    className="nav-item flex items-center justify-between w-full px-4 py-3 text-sm font-mono rounded-lg transition-all duration-200"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.06)'; e.currentTarget.style.color = '#00f5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" style={{ color: '#00f5ff' }} />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedMenus[index] ? 'rotate-90' : ''}`} style={{ color: '#00f5ff' }} />
                  </button>
                  <AnimatePresence>
                    {expandedMenus[index] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden pl-6"
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.url}
                            onClick={closeSidebar}
                            className="block pl-6 pr-2 py-2 my-1 text-sm font-mono rounded-md transition-all duration-200"
                            style={location.pathname === subItem.url
                              ? { background: 'rgba(0,245,255,0.1)', color: '#00f5ff', borderLeft: '2px solid #00f5ff', boxShadow: '0 0 8px rgba(0,245,255,0.1)' }
                              : { color: 'rgba(255,255,255,0.45)', borderLeft: '2px solid transparent' }
                            }
                            onMouseEnter={e => { if (location.pathname !== subItem.url) { e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.borderLeftColor = 'rgba(0,245,255,0.4)'; }}}
                            onMouseLeave={e => { if (location.pathname !== subItem.url) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  to={item.url}
                  onClick={closeSidebar}
                  className="nav-item flex items-center gap-3 px-4 py-3 text-sm font-mono rounded-lg transition-all duration-200"
                  style={location.pathname === item.url
                    ? { background: 'rgba(0,245,255,0.1)', color: '#00f5ff', border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 0 10px rgba(0,245,255,0.08)' }
                    : { color: 'rgba(255,255,255,0.6)', border: '1px solid transparent' }
                  }
                  onMouseEnter={e => { if (location.pathname !== item.url) { e.currentTarget.style.background = 'rgba(0,245,255,0.06)'; e.currentTarget.style.color = '#00f5ff'; }}}
                  onMouseLeave={e => { if (location.pathname !== item.url) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
                >
                  <item.icon className="h-5 w-5" style={{ color: '#00f5ff' }} />
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <button
            onClick={() => logout()}
            className="nav-item flex items-center gap-3 w-full px-4 py-3 text-sm font-mono rounded-lg transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.1)'; e.currentTarget.style.color = '#ff6b35'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut className="h-5 w-5" style={{ color: '#ff6b35' }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 px-6" style={{ borderBottom: '1px solid rgba(0,245,255,0.1)', background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(12px)' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden" style={{ color: '#00f5ff' }}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-black font-mono" style={{ color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.4)' }}>
            {(location.pathname === '/' || location.pathname === createPageUrl('Dashboard')) ? `WELCOME, ${([user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'USER').toUpperCase()}${staffDesignation ? ` (${staffDesignation.toUpperCase()})` : ''}` : 'CAMPUSENSE'}
          </h1>
        </header>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={closeSidebar}
          />
        )}
      </div>
    </>
  );
};

const FuturisticLayout = ({ children, currentPageName }) => {
  return (
    <PermissionProvider>
      <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
        <NavigationContent />
        <div className="lg:ml-72">
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </PermissionProvider>
  );
};

export default FuturisticLayout;