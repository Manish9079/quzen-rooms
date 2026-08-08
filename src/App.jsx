import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ExploreRooms from './pages/ExploreRooms';
import MainRoom from './pages/MainRoom';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/login" element={<Layout footer={false}><Login /></Layout>} />
      <Route path="/register" element={<Layout footer={false}><Register /></Layout>} />
      <Route path="/verify-email" element={<Layout footer={false}><VerifyEmail /></Layout>} />
      <Route path="/explore" element={<Layout><ExploreRooms /></Layout>} />
      <Route path="/create" element={<Layout><ProtectedRoute><CreateRoom /></ProtectedRoute></Layout>} />
      <Route path="/join" element={<Layout><ProtectedRoute><JoinRoom /></ProtectedRoute></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
      <Route path="/settings" element={<Layout><ProtectedRoute><Settings /></ProtectedRoute></Layout>} />
      <Route path="/room/:code" element={<ProtectedRoute><MainRoom /></ProtectedRoute>} />
      <Route path="*" element={<Layout footer={false}><NotFound /></Layout>} />
    </Routes>
  );
}
