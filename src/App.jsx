import {
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import SEO from './components/common/SEO';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ExploreRooms from './pages/ExploreRooms';
import MainRoom from './pages/MainRoom';

import Profile from './pages/Profile';
import Friends from './pages/Friends';
import DirectChat from './pages/DirectChat';
import Settings from './pages/Settings';

import NotFound from './pages/NotFound';

function PrivatePageSEO() {
  const location = useLocation();

  const publicPages = [
    '/',
    '/explore',
  ];

  const isPublicPage =
    publicPages.includes(location.pathname);

  // Home and Explore already have their own SEO component
  if (isPublicPage) {
    return null;
  }

  return (
    <SEO
      title="Quzen Rooms"
      description="Quzen Rooms private account and room page."
      canonical={`https://qyzen.online${location.pathname}`}
      noindex
    />
  );
}

export default function App() {
  return (
    <>
      <PrivatePageSEO />

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
    </>
  );
}