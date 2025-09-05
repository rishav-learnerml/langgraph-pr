import { createContext, useContext, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/constants/navitems";
import { ChevronDown } from "lucide-react";
import { SidebarContextType } from "@/types/sidebar";
import { useDispatch } from "react-redux";
import { clearChat } from "@/redux/slices/chatSlice";
import { useHistory } from "@/hooks/useHistory";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { addOptimisticSession } from "@/redux/slices/historySlice";

const SidebarContext = createContext<SidebarContextType | null>(null);

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

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

const Sidebar = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get("sessionId")
  );

  const dispatch = useDispatch();

  // ✅ useHistory hook
  const { sessions, fetchSessions, loading, error } = useHistory();
  const { fetchConversation } = useConversationHistory();

  // expand dropdown initially + fetch sessions
  useEffect(() => {
    const defaultExpandable = navItems.find((n) => n.expandable)?.name;
    if (defaultExpandable) {
      setExpanded(defaultExpandable);
      fetchSessions();
    }
  }, [fetchSessions]);

  const handleExpand = (name: string) => {
    if (expanded === name) {
      setExpanded(null);
    } else {
      setExpanded(name);
      fetchSessions(); // fetch fresh sessions when opened
    }
  };

  useEffect(() => {
    fetchConversation(currentSessionId);
    setCurrentSessionId(searchParams.get("sessionId"));
  }, []);

  return (
    <aside className="hidden md:flex h-screen w-72 border-r bg-background">
      <ScrollArea className="flex-1 py-6 px-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-2"
        >
          {navItems.map(({ name, path, icon: Icon, expandable }) => (
            <div key={name} className="flex flex-col">
              <Button
                asChild
                className="w-full justify-start gap-3"
                onClick={() => {
                  expandable ? handleExpand(name) : null;
                }}
              >
                {path ? (
                  <Link
                    to={path}
                    onClick={() => {
                      dispatch(clearChat());
                      setCurrentSessionId(searchParams.get("sessionId"));
                      dispatch(
                        addOptimisticSession({
                          thread_id: searchParams.get("sessionId") as string,
                          title: "New Chat",
                        })
                      );
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {name}
                    {expandable && (
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          expanded === name ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>
                ) : (
                  <div
                    onClick={() => {
                      fetchConversation(searchParams.get("sessionId"));
                      setCurrentSessionId(searchParams.get("sessionId"));
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {name}
                    {expandable && (
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          expanded === name ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                )}
              </Button>

              {/* Expandable submenu */}
              {expandable && expanded === name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="ml-8 mt-4 flex flex-col gap-3 max-h-[75vh] overflow-auto custom-scrollbar"
                >
                  {loading && (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, idx) => (
                        <div
                          key={idx}
                          className="h-10 w-full bg-gray-700 animate-pulse rounded-lg"
                        ></div>
                      ))}
                    </div>
                  )}
                  {error && (
                    <p className="text-xs text-destructive px-2">⚠️ {error}</p>
                  )}
                  {!loading &&
                    sessions?.map(({ thread_id, title }:any) => (
                      <Link
                        to={`chat?sessionId=${thread_id}`}
                        className={`text-sm text-muted-foreground hover:text-foreground border rounded-lg p-2 mx-4 hover:bg-gray-600 text-white ${
                          thread_id === searchParams.get("sessionId") || title==='New Chat'
                            ? "bg-gray-700"
                            : "bg-black"
                        }`}
                        key={thread_id}
                        onClick={() => {
                          setCurrentSessionId(thread_id);
                          // dispatch(clearChat());
                          fetchSessions();
                        }}
                      >
                        {title}
                      </Link>
                    ))}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
