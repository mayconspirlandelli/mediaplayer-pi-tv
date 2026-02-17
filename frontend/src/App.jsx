import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Player from './components/Player';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter 
      future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}
    >
      <Routes>
        <Route path="/" element={<Player />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
