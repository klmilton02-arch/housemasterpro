import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
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
import Stable from './pages/Stable';
import CatShelter from './pages/CatShelter';
import Landing from './pages/Landing';
import FAQ from './pages/FAQ';
import Leaderboard from './pages/Leaderboard';
import CalendarPage from './pages/Calendar';
import TaskStartDates from './pages/TaskStartDates';



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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  const publicPaths = ['/', '/landing', '/encryption', '/digital-services-act', '/copyright'];
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
        <Route path="/" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Landing />
          </motion.div>
        } />
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
        
        {/* Protected routes */}
        <Route element={<Layout />}>
          {[{ path: "/dashboard", el: <Dashboard /> }, { path: "/tasks", el: <Tasks /> }, { path: "/needs-attention", el: <NeedsAttention /> }, { path: "/presets", el: <Presets /> }, { path: "/home-setup", el: <HomeSetup /> }, { path: "/profile", el: <Profile /> },
          { path: "/family", el: <Family /> }, { path: "/stable", el: <Stable /> }, { path: "/cats", el: <CatShelter /> }, { path: "/leaderboard", el: <Leaderboard /> }, { path: "/calendar", el: <CalendarPage /> }, { path: "/task-start-dates", el: <TaskStartDates /> }, { path: "/privacy", el: <Privacy /> }, { path: "/support", el: <Support /> }, { path: "/faq", el: <FAQ /> }, { path: "*", el: <PageNotFound /> }].map(({ path, el }) => (
            <Route key={path} path={path} element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                {el}
              </motion.div>
            } />
          ))}
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