import './App.css';
import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from './Layout/Layout';
// Import pages
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplaintManagement from './pages/ComplaintManagement';
import ComplaintDetails from './pages/ComplaintDetail';
import ComplaintChat from './pages/ComplaintChat';
import UserManagement from './pages/UserManagement';
import ComplaintCategory from './pages/ComplaintCategory';
import RoomManagement from './pages/RoomManagement';
import LoadingOverlay from "./components/LoadingOverlay";
import NotFoundPages from './components/NotFoundPages';

//Configure App.js with routes (e.g., login, dashboard, complaints).
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState("admin"); 

    // Simulate auth check (replace with real API call)
    useEffect(() => {
        
        setTimeout(() => {
            setIsLoggedIn(true); 
            setIsLoading(false);
        }, 500);
    }, []);

    const router = createBrowserRouter([
        {
            path: "/",
            element: isLoggedIn ? <Layout userRole={userRole}/> : <LoginPage setIsLoggedIn={setIsLoggedIn} />, 
            errorElement: <NotFoundPages />, 
            children: [
                { path: "dashboard", element: <Dashboard /> },
                { path: "complaints", element: <ComplaintManagement /> },
                { path: "complaints/:id", element: <ComplaintDetails /> },
                { path: "complaints/:id/chat", element: <ComplaintChat /> },
                { path: "users", element: <UserManagement /> },
                { path: "categories", element: <ComplaintCategory /> },
                { path: "rooms", element: <RoomManagement /> },
            ],
        },
    ]);

    if (isLoading) {
        return <LoadingOverlay />;
    }

    return <RouterProvider router={router} />;
}

export default App;



