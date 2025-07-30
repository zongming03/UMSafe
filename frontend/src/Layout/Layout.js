import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout({ userRole }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <Header />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          userRole={userRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          style={{ width: "240px", minWidth: "200px" }}
        />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
