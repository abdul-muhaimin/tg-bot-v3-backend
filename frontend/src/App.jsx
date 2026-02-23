import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import ScreenLoader from "./components/ScreenLoader";
import ErrorScreen from "./components/ErrorScreen";
import TncScreen from "./components/TncScreen";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";

const Requests = () => (
  <div className="page page-enter">
    <p className="t-title" style={{ padding: "16px 0" }}>
      My Requests
    </p>
  </div>
);
const Settings = () => (
  <div className="page page-enter">
    <p className="t-title" style={{ padding: "16px 0" }}>
      Settings
    </p>
  </div>
);
const AdminDashboard = () => (
  <div className="page page-enter">
    <p className="t-title" style={{ padding: "16px 0" }}>
      Admin Dashboard
    </p>
  </div>
);
const AdminRequests = () => (
  <div className="page page-enter">
    <p className="t-title" style={{ padding: "16px 0" }}>
      Admin Requests
    </p>
  </div>
);
const AdminUsers = () => (
  <div className="page page-enter">
    <p className="t-title" style={{ padding: "16px 0" }}>
      Admin Users
    </p>
  </div>
);

function AppInner() {
  const { loading, error, user, systemOpen } = useApp();

  if (loading) return <ScreenLoader />;

  if (error === "banned") return <ErrorScreen type="banned" />;
  if (error === "not_started") return <ErrorScreen type="not_started" />;
  if (error) return <ErrorScreen type="generic" />;

  if (!user?.tncAccepted) return <TncScreen />;
  if (!systemOpen) return <ErrorScreen type="system_closed" />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AppProvider>
  );
}
