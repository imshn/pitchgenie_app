"use client";

import { Search, User, Menu, Inbox } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SideNav } from "@/components/SideNav";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  // Generate breadcrumbs from path
  const breadcrumbs = pathname
    .split("/")
    .filter((path) => path)
    .map((path) => path.charAt(0).toUpperCase() + path.slice(1));

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SideNav />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">PitchGenie</span>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb} className="flex items-center">
            <span className="mx-2">/</span>
            <span className={index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {crumb}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-secondary/50 border-border/50 focus:bg-background transition-all"
            />
          </div>
        </form>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/inbox")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Inbox className="h-5 w-5" />
          <span className="sr-only">Inbox</span>
        </Button>

        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full" data-tour="profile">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/support")}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
