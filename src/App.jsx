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
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import NeedsAttention from './pages/NeedsAttention';
import Presets from './pages/Presets';
import Family from './pages/Family';
import Leaderboard from './pages/Leaderboard';
import HomeSetup from './pages/HomeSetup';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import Encryption from './pages/Encryption';
import DigitalServicesAct from './pages/DigitalServicesAct';
import Copyright from './pages/Copyright';
import Profile from './pages/Profile';
import Stable from './pages/Stable';
import Landing from './pages/Landing';


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

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (but allow public pages)
  if (authError && !window.location.pathname.startsWith('/encryption') && !window.location.pathname.startsWith('/digital-services-act') && !window.location.pathname.startsWith('/copyright')) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes - no auth required */}
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
          {[{ path: "/", el: <Dashboard /> }, { path: "/tasks", el: <Tasks /> }, { path: "/needs-attention", el: <NeedsAttention /> }, { path: "/presets", el: <Presets /> }, { path: "/family", el: <Family /> }, { path: "/leaderboard", el: <Leaderboard /> }, { path: "/home-setup", el: <HomeSetup /> }, { path: "/profile", el: <Profile /> },
          { path: "/stable", el: <Stable /> }, { path: "/privacy", el: <Privacy /> }, { path: "/support", el: <Support /> }, { path: "*", el: <PageNotFound /> }].map(({ path, el }) => (
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
      <QueryClientProvider client={queryClientInstance}>
        <DarkModeSync />
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App