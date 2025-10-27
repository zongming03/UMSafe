import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout({ userRole }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar
          userRole={userRole}
          style={{ width: "240px", minWidth: "200px" }}
        />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}

