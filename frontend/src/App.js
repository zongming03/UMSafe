import "./App.css";
import { useState, useContext } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout/Layout";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ComplaintManagement from "./pages/ComplaintManagement";
import ComplaintDetails from "./pages/ComplaintDetail";
import ComplaintChat from "./pages/ComplaintChat";
import UserManagement from "./pages/UserManagement";
import ComplaintCategory from "./pages/ComplaintCategory";
import RoomManagement from "./pages/RoomManagement";
import LoadingOverlay from "./components/LoadingOverlay";
import NotFoundPages from "./components/NotFoundPages";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingOverlay />;
  }

  const router = createBrowserRouter([
    {
      path: "/",
      element: user ? <Layout userRole={user.role} /> : <LoginPage />,
      errorElement: <NotFoundPages />,
      children: user
        ? [
            { path: "dashboard", element: <Dashboard /> },
            { path: "users", element: <UserManagement /> },
            { path: "categories", element: <ComplaintCategory /> },
            { path: "rooms", element: <RoomManagement /> },
            { path: "forgot-password", element: <ForgotPasswordPage /> },
            { path: "reset-password/:token", element: <ResetPasswordPage /> },
            { path: "settings", element: <SettingsPage /> },
            { path: "complaints", element: <ComplaintManagement /> },
            { path: "complaints/:id", element: <ComplaintDetails /> },
            { path: "complaints/:id/:chatId", element: <ComplaintChat /> },
          ]
        : [],
    },
    {
      path: "/login",
      element: <LoginPage />,
    },{
      path: "/forgot-password",
      element: <ForgotPasswordPage />,
    },{
      path: "/reset-password/:token",
      element: <ResetPasswordPage />,
    }
  ]);

  return <RouterProvider router={router} />;
}

export default App;
