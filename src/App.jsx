import { lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import SEO from './components/common/SEO';

// Homepage initial bundle me rahega
import Landing from './pages/Landing';

// Baaki pages demand par load honge
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

const CreateRoom = lazy(() => import('./pages/CreateRoom'));
const JoinRoom = lazy(() => import('./pages/JoinRoom'));
const ExploreRooms = lazy(() => import('./pages/ExploreRooms'));
const MainRoom = lazy(() => import('./pages/MainRoom'));

const Profile = lazy(() => import('./pages/Profile'));
const Friends = lazy(() => import('./pages/Friends'));
const DirectChat = lazy(() => import('./pages/DirectChat'));
const Settings = lazy(() => import('./pages/Settings'));

const NotFound = lazy(() => import('./pages/NotFound'));

function PrivatePageSEO() {
  const location = useLocation();

  const publicPages = [
    '/',
    '/explore',
  ];

  const isPublicPage = publicPages.includes(location.pathname);

  // Home and Explore already have their own SEO component
  if (isPublicPage) {
    return null;
  }

  return (
    <SEO
      title="Qyzen Rooms"
      description="Qyzen Rooms private account and room page."
      canonical={`https://qyzen.online${location.pathname}`}
      noindex
    />
  );
}

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <>
      <PrivatePageSEO />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Landing />
              </Layout>
            }
          />

          <Route
            path="/explore"
            element={
              <Layout>
                <ExploreRooms />
              </Layout>
            }
          />

          <Route
            path="/login"
            element={
              <Layout footer={false}>
                <Login />
              </Layout>
            }
          />

          <Route
            path="/register"
            element={
              <Layout footer={false}>
                <Register />
              </Layout>
            }
          />

          <Route
            path="/verify-email"
            element={
              <Layout footer={false}>
                <VerifyEmail />
              </Layout>
            }
          />

          <Route
            path="/create"
            element={
              <Layout>
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/join"
            element={
              <Layout>
                <ProtectedRoute>
                  <JoinRoom />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/profile"
            element={
              <Layout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/friends"
            element={
              <Layout>
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/chat/:userId"
            element={
              <Layout footer={false}>
                <ProtectedRoute>
                  <DirectChat />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/settings"
            element={
              <Layout>
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/room/:code"
            element={
              <ProtectedRoute>
                <MainRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Layout footer={false}>
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}