import { createContext, useContext, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const SidebarContext = createContext<any>(null);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Chat", path: "/chat", icon: MessageSquare },
  { name: "Settings", path: "/settings", icon: Settings },
];

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex h-screen w-64 border-r bg-background">
      <ScrollArea className="flex-1 py-6 px-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-2"
        >
          {navItems.map(({ name, path, icon: Icon }) => (
            <Link key={name} to={path}>
              <Button
                variant={pathname === path ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <Icon className="h-5 w-5" />
                {name}
              </Button>
            </Link>
          ))}
        </motion.div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
