import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { BlastModeProvider } from './lib/BlastModeContext';
import { LargeIconsProvider } from './lib/LargeIconsContext';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import NeedsAttention from './pages/NeedsAttention';
import Presets from './pages/Presets';
import HomeSetup from './pages/HomeSetup';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import Encryption from './pages/Encryption';
import DigitalServicesAct from './pages/DigitalServicesAct';
import Copyright from './pages/Copyright';
import Profile from './pages/Profile';
import Family from './pages/Family';
import CatShelter from './pages/CatShelter';
import Landing from './pages/Landing';
import FAQ from './pages/FAQ';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Leaderboard from './pages/Leaderboard';
import CalendarPage from './pages/Calendar';
import TaskStartDates from './pages/TaskStartDates';
import JoinFamilyOnSignup from './pages/JoinFamilyOnSignup';
import AgeSuitability from './pages/AgeSuitability';
import Accessibility from './pages/Accessibility';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminActivity from './pages/AdminActivity';



const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

function DarkModeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return null;
}

const RootRedirect = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();
  if (isLoadingAuth || isLoadingPublicSettings) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/landing" replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  const publicPaths = ['/', '/landing', '/login', '/register', '/forgot-password', '/reset-password', '/encryption', '/digital-services-act', '/copyright', '/age-suitability', '/accessibility', '/faq', '/about', '/contact', '/privacy'];
  const isPublicPath = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'));

  // Redirect to login in an effect (not during render) to avoid infinite loops
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && authError?.type === 'auth_required' && !isPublicPath) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError, isPublicPath]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (but allow public pages)
  if (authError && !isPublicPath) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect happening in useEffect above
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes - no auth required */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/landing" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Landing />
          </motion.div>
        } />
        <Route path="/encryption" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Encryption />
          </motion.div>
        } />
        <Route path="/digital-services-act" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <DigitalServicesAct />
          </motion.div>
        } />
        <Route path="/copyright" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Copyright />
          </motion.div>
        } />
        <Route path="/age-suitability" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <AgeSuitability />
          </motion.div>
        } />
        <Route path="/accessibility" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Accessibility />
          </motion.div>
        } />
        <Route path="/faq" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <FAQ />
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <About />
          </motion.div>
        } />
        <Route path="/contact" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Contact />
          </motion.div>
        } />
        <Route path="/privacy" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Privacy />
          </motion.div>
        } />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Post-signup family join */}
        <Route path="/join-family" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <JoinFamilyOnSignup />
          </motion.div>
        } />

        {/* Protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<Layout />}>
            {[{ path: "/dashboard", el: <Dashboard /> }, { path: "/tasks", el: <Tasks /> }, { path: "/needs-attention", el: <NeedsAttention /> }, { path: "/presets", el: <Presets /> }, { path: "/home-setup", el: <HomeSetup /> }, { path: "/profile", el: <Profile /> },
            { path: "/family", el: <Family /> }, { path: "/cats", el: <CatShelter /> }, { path: "/leaderboard", el: <Leaderboard /> }, { path: "/calendar", el: <CalendarPage /> }, { path: "/task-start-dates", el: <TaskStartDates /> }, { path: "/support", el: <Support /> }, { path: "/admin/activity", el: <AdminActivity /> }, { path: "*", el: <PageNotFound /> }].map(({ path, el }) => (
              <Route key={path} path={path} element={
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  {el}
                </motion.div>
              } />
            ))}
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <BlastModeProvider>
      <LargeIconsProvider>
      <QueryClientProvider client={queryClientInstance}>
        <DarkModeSync />
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LargeIconsProvider>
      </BlastModeProvider>
    </AuthProvider>
  );
}

export default App