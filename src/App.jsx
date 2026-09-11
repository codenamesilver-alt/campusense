import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import BackupAndRestore from './pages/BackupAndRestore';
import TransferStudent from './pages/TransferStudent';
import IDCardDesign from './pages/IDCardDesign';
import IDCardPrint from './pages/IDCardPrint';
import SchoolCalendar from './pages/SchoolCalendar';
import ExamInsights from './pages/ExamInsights';
import ReEnableStudent from './pages/ReEnableStudent';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoginPage from '@/components/auth/LoginPage';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Show local login page
      return <LoginPage />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/BackupAndRestore" element={<LayoutWrapper currentPageName="BackupAndRestore"><BackupAndRestore /></LayoutWrapper>} />
      <Route path="/TransferStudent" element={<LayoutWrapper currentPageName="TransferStudent"><TransferStudent /></LayoutWrapper>} />
      <Route path="/ReEnableStudent" element={<LayoutWrapper currentPageName="ReEnableStudent"><ReEnableStudent /></LayoutWrapper>} />
      <Route path="/SchoolCalendar" element={<LayoutWrapper currentPageName="SchoolCalendar"><SchoolCalendar /></LayoutWrapper>} />
      <Route path="/IDCardDesign" element={<LayoutWrapper currentPageName="IDCardDesign"><IDCardDesign /></LayoutWrapper>} />
      <Route path="/IDCardPrint" element={<LayoutWrapper currentPageName="IDCardPrint"><IDCardPrint /></LayoutWrapper>} />
      <Route path="/ExamInsights" element={<LayoutWrapper currentPageName="ExamInsights"><ExamInsights /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App