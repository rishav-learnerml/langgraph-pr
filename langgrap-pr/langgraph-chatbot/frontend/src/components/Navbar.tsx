import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

const Navbar = () => {
  const { setTheme } = useTheme();

  return (
    <nav className="bg-card text-card-foreground p-4 flex justify-between items-center border-b border-border shadow-md z-10 relative">
      <Link
        to="/"
        className="text-3xl font-extrabold text-primary tracking-wide"
      >
        ChatSphere
      </Link>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover text-popover-foreground border dark:border-gray-300 shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer dark:text-gray-200"
            >
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer dark:text-gray-200"
            >
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer dark:text-gray-200"
            >
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
