import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsReport from '../components/reports/AnalyticsReport';
import AllStudentsReport from '../components/reports/AllStudentsReport';
import AdmissionEnquiryReport from '../components/reports/AdmissionEnquiryReport';
import ClassStudentListReport from '../components/reports/ClassStudentListReport';
import DeactivatedStudentReport from '../components/reports/DeactivatedStudentReport';
import FeeDefaulterReport from '../components/reports/FeeDefaulterReport';
import StudentAttendanceReport from '../components/reports/StudentAttendanceReport';
import PendingBooksReport from '../components/reports/PendingBooksReport';
import FeeCollectionReport from '../components/reports/FeeCollectionReport';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports Center</h1>
        <p className="text-gray-500">Generate, view, and export detailed school reports.</p>
      </div>
      
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
          <TabsTrigger value="all_students">All Students</TabsTrigger>
          <TabsTrigger value="class_students">Class List</TabsTrigger>
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="deactivated">Inactive/Deleted</TabsTrigger>
          <TabsTrigger value="defaulters">Fee Defaulters</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="library">Library Dues</TabsTrigger>
          <TabsTrigger value="fee_collection">💰 Fee Report</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsReport />
        </TabsContent>
        <TabsContent value="all_students">
          <AllStudentsReport />
        </TabsContent>
        <TabsContent value="class_students">
          <ClassStudentListReport />
        </TabsContent>
        <TabsContent value="admissions">
          <AdmissionEnquiryReport />
        </TabsContent>
        <TabsContent value="deactivated">
          <DeactivatedStudentReport />
        </TabsContent>
        <TabsContent value="defaulters">
          <FeeDefaulterReport />
        </TabsContent>
        <TabsContent value="attendance">
          <StudentAttendanceReport />
        </TabsContent>
        <TabsContent value="library">
          <PendingBooksReport />
        </TabsContent>
        <TabsContent value="fee_collection">
          <FeeCollectionReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}