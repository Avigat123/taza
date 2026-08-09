import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import {
  PageHeaderProvider,
  usePageHeader,
} from "../../context/PageHeaderContext";

function Shell() {
  const location = useLocation();
  const { title, subtitle } = usePageHeader();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Top Navigation */}
      <Sidebar />

      {/* Page Header */}
      <Navbar title={title} subtitle={subtitle} />

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <main
          key={location.pathname}
          className="flex-1 p-6 max-w-[1400px] w-full mx-auto"
        >
          <Outlet />
        </main>
      </AnimatePresence>
  
    </div>
  );
}

export default function AppShell() {
  return (
    <PageHeaderProvider>
      <Shell />
    </PageHeaderProvider>
  );
}