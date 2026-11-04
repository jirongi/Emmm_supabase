import Home from "./page/Home";
import Meet from "./page/Meet";
import Landing from "./page/Landing";
import ProtectedRoute from "./auth/ProtectedRoute";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "./component/Toast";
import "./CSS/motion.css";

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        {/* /meet = 새 회의 만들기, /meet/:roomId = 회의방 */}
        <Route path="/meet" element={<ProtectedRoute><Meet /></ProtectedRoute>} />
        <Route path="/meet/:roomId" element={<ProtectedRoute><Meet /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
