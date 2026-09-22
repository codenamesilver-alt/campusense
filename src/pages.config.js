import Dashboard from './pages/Dashboard';
import StudentDetails from './pages/StudentDetails';
import DisabledDeletedStudent from './pages/DisabledDeletedStudent';
import AdmissionEnquiry from './pages/AdmissionEnquiry';
import Complaints from './pages/Complaints';
import StudentAdmission from './pages/StudentAdmission';
import DisableStudent from './pages/DisableStudent';
import BulkDeleteStudent from './pages/BulkDeleteStudent';
import StudentHouse from './pages/StudentHouse';
import ExportStudent from './pages/ExportStudent';
import ImportStudent from './pages/ImportStudent';
import SearchPaidFees from './pages/SearchPaidFees';
import SearchDueFees from './pages/SearchDueFees';
import FeesCollect from './pages/FeesCollect';
import FeesMaster from './pages/FeesMaster';
import FeesGroup from './pages/FeesGroup';
import FeesType from './pages/FeesType';
import FeesDiscount from './pages/FeesDiscount';
import FeesReminder from './pages/FeesReminder';
import AddIncome from './pages/AddIncome';
import SearchIncome from './pages/SearchIncome';
import IncomeHead from './pages/IncomeHead';
import AddExpense from './pages/AddExpense';
import SearchExpense from './pages/SearchExpense';
import ExpenseHead from './pages/ExpenseHead';
import ExamGroup from './pages/ExamGroup';
import ExamSchedule from './pages/ExamSchedule';
import DesignAdmitCard from './pages/DesignAdmitCard';
import PrintAdmitCard from './pages/PrintAdmitCard';
import DesignMarksheet from './pages/DesignMarksheet';
import PrintMarksheet from './pages/PrintMarksheet';
import MarksGrades from './pages/MarksGrades';
import MarksDivision from './pages/MarksDivision';
import Attendance from './pages/Attendance';
import ApproveLeave from './pages/ApproveLeave';
import AttendanceByDate from './pages/AttendanceByDate';
import ClassTimetable from './pages/ClassTimetable';
import TeachersTimetable from './pages/TeachersTimetable';
import AssignClassTeacher from './pages/AssignClassTeacher';
import PromoteStudent from './pages/PromoteStudent';
import SubjectGroup from './pages/SubjectGroup';
import CreateClass from './pages/CreateClass';
import CreateSection from './pages/CreateSection';
import StaffDirectory from './pages/StaffDirectory';
import AddStaff from './pages/AddStaff';
import StaffAttendance from './pages/StaffAttendance';
import Department from './pages/Department';
import Designation from './pages/Designation';
import NoticeBoard from './pages/NoticeBoard';
import SendEmail from './pages/SendEmail';
import SendSMS from './pages/SendSMS';
import EmailTemplate from './pages/EmailTemplate';
import SMSTemplate from './pages/SMSTemplate';
import BookList from './pages/BookList';
import IssueBook from './pages/IssueBook';
import ReturnBook from './pages/ReturnBook';
import IssueItem from './pages/IssueItem';
import AddItemStock from './pages/AddItemStock';
import ItemCategory from './pages/ItemCategory';
import ItemSupplier from './pages/ItemSupplier';
import Routes from './pages/Routes';
import Vehicle from './pages/Vehicle';
import AssignDriver from './pages/AssignDriver';
import StudentTransportFees from './pages/StudentTransportFees';
import StudentReport from './pages/StudentReport';
import GeneralSettings from './pages/GeneralSettings';
import SessionSettings from './pages/SessionSettings';
import NotificationSettings from './pages/NotificationSettings';
import Users from './pages/Users';
import RolesPermission from './pages/RolesPermission';
import FeeHeadDefinition from './pages/FeeHeadDefinition';
import ClassFeeStructure from './pages/ClassFeeStructure';
import StudentFeeMapping from './pages/StudentFeeMapping';
import DiscountManagement from './pages/DiscountManagement';
import FeeCollection from './pages/FeeCollection';
import FeeReports from './pages/FeeReports';
import FeeNotifications from './pages/FeeNotifications';
import FinanceDashboard from './pages/FinanceDashboard';
import AdmitCardDesigner from './pages/AdmitCardDesigner';
import MarksDivisionAnalysis from './pages/MarksDivisionAnalysis';
import SendWhatsApp from './pages/SendWhatsApp';
import CommunicateSettings from './pages/CommunicateSettings';
import Reports from './pages/Reports';
import PaymentSettings from './pages/PaymentSettings';
import DataDebug from './pages/DataDebug';
import FeeCollect from './pages/FeeCollect';
import Payroll from './pages/Payroll.jsx';
import StaffLeaveApplication from './pages/StaffLeaveApplication';
import StaffLeaveApproval from './pages/StaffLeaveApproval';
import StaffLeaveCalendar from './pages/StaffLeaveCalendar';
import MarksEntry from './pages/MarksEntry';
import ReportCard from './pages/ReportCard';
import ReportCardSettings from './pages/ReportCardSettings';
import ResultAnalysis from './pages/ResultAnalysis';
import LeaveManagementSettings from './pages/LeaveManagementSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "StudentDetails": StudentDetails,
    "DisabledDeletedStudent": DisabledDeletedStudent,
    "AdmissionEnquiry": AdmissionEnquiry,
    "Complaints": Complaints,
    "StudentAdmission": StudentAdmission,
    "DisableStudent": DisableStudent,
    "BulkDeleteStudent": BulkDeleteStudent,
    "StudentHouse": StudentHouse,
    "ExportStudent": ExportStudent,
    "ImportStudent": ImportStudent,
    "SearchPaidFees": SearchPaidFees,
    "SearchDueFees": SearchDueFees,
    "FeesCollect": FeesCollect,
    "FeesMaster": FeesMaster,
    "FeesGroup": FeesGroup,
    "FeesType": FeesType,
    "FeesDiscount": FeesDiscount,
    "FeesReminder": FeesReminder,
    "AddIncome": AddIncome,
    "SearchIncome": SearchIncome,
    "IncomeHead": IncomeHead,
    "AddExpense": AddExpense,
    "SearchExpense": SearchExpense,
    "ExpenseHead": ExpenseHead,
    "ExamGroup": ExamGroup,
    "ExamSchedule": ExamSchedule,
    "DesignAdmitCard": DesignAdmitCard,
    "PrintAdmitCard": PrintAdmitCard,
    "DesignMarksheet": DesignMarksheet,
    "PrintMarksheet": PrintMarksheet,
    "MarksGrades": MarksGrades,
    "MarksDivision": MarksDivision,
    "Attendance": Attendance,
    "ApproveLeave": ApproveLeave,
    "AttendanceByDate": AttendanceByDate,
    "ClassTimetable": ClassTimetable,
    "TeachersTimetable": TeachersTimetable,
    "AssignClassTeacher": AssignClassTeacher,
    "PromoteStudent": PromoteStudent,
    "SubjectGroup": SubjectGroup,
    "CreateClass": CreateClass,
    "CreateSection": CreateSection,
    "StaffDirectory": StaffDirectory,
    "AddStaff": AddStaff,
    "StaffAttendance": StaffAttendance,
    "Department": Department,
    "Designation": Designation,
    "NoticeBoard": NoticeBoard,
    "SendEmail": SendEmail,
    "SendSMS": SendSMS,
    "EmailTemplate": EmailTemplate,
    "SMSTemplate": SMSTemplate,
    "BookList": BookList,
    "IssueBook": IssueBook,
    "ReturnBook": ReturnBook,
    "IssueItem": IssueItem,
    "AddItemStock": AddItemStock,
    "ItemCategory": ItemCategory,
    "ItemSupplier": ItemSupplier,
    "Routes": Routes,
    "Vehicle": Vehicle,
    "AssignDriver": AssignDriver,
    "StudentTransportFees": StudentTransportFees,
    "StudentReport": StudentReport,
    "GeneralSettings": GeneralSettings,
    "SessionSettings": SessionSettings,
    "NotificationSettings": NotificationSettings,
    "Users": Users,
    "RolesPermission": RolesPermission,
    "FeeHeadDefinition": FeeHeadDefinition,
    "ClassFeeStructure": ClassFeeStructure,
    "StudentFeeMapping": StudentFeeMapping,
    "DiscountManagement": DiscountManagement,
    "FeeCollection": FeeCollection,
    "FeeReports": FeeReports,
    "FeeNotifications": FeeNotifications,
    "FinanceDashboard": FinanceDashboard,
    "AdmitCardDesigner": AdmitCardDesigner,
    "MarksDivisionAnalysis": MarksDivisionAnalysis,
    "SendWhatsApp": SendWhatsApp,
    "CommunicateSettings": CommunicateSettings,
    "Reports": Reports,
    "PaymentSettings": PaymentSettings,
    "DataDebug": DataDebug,
    "FeeCollect": FeeCollect,
    "Payroll": Payroll,
    "StaffLeaveApplication": StaffLeaveApplication,
    "StaffLeaveApproval": StaffLeaveApproval,
    "StaffLeaveCalendar": StaffLeaveCalendar,
    "MarksEntry": MarksEntry,
    "ReportCard": ReportCard,
    "ReportCardSettings": ReportCardSettings,
    "ResultAnalysis": ResultAnalysis,
    "LeaveManagementSettings": LeaveManagementSettings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};