import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkerDashboard from "./pages/WorkerDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";
import AdminDashboard from "./pages/AdminDashboard";
import TrackingPage from "./pages/TrackingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<HomePage />} />
        <Route path="/worker"              element={<WorkerDashboard />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register"            element={<RegisterPage />} />
        <Route path="/payment/:bookingId"  element={<PaymentPage />} />
        <Route path="/admin"               element={<AdminDashboard />} />
        <Route path="/track/:bookingId"    element={<TrackingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
