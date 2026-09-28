import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Contributions from "./pages/Contributions";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    </div>
  );
}

export default function App() {
  const { user, familyId, loading } = useAuth();

  // The auth session must be checked before we decide anything else,
  // otherwise a not-yet-loaded session briefly renders the login screen
  // instead of the spinner (this was the original bug: !user was checked
  // before loading, so the app could get stuck showing the wrong screen).
  if (loading) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  // Logged in but not attached to any family yet: send to onboarding
  // instead of silently rendering an empty dashboard.
  if (!familyId) {
    return <Onboarding />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/membres" element={<Members />} />
        <Route path="/cotisations" element={<Contributions />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/conditions" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
