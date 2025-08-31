import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar, { SidebarProvider } from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarProvider>
        {location.pathname === "/chat" && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 py-6 px-4 md:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          <Footer />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
