import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import ScreenLoader from "./components/ScreenLoader";
import ErrorScreen from "./components/ErrorScreen";
import TncScreen from "./components/TncScreen";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Recovery from "./pages/Recovery";
import NewId from "./pages/NewId";
import Transfer from "./pages/Transfer";
import Support from "./pages/Support";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRequests from "./pages/admin/Requests";
import AdminUsers from "./pages/admin/Users";

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
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/recovery" element={<Recovery />} />
        <Route path="/newid" element={<NewId />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/support" element={<Support />} />
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
