
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Calendar, Home, Map, MessageSquare, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeModeToggle } from './ThemeModeToggle';
import { useAuth } from '@/context/AuthContext';

const NavigationBar: React.FC = () => {
  const { currentUser, userProfile, signInWithGoogle, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', name: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/events', name: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { path: '/lost-found', name: 'Lost & Found', icon: <Search className="w-5 h-5" /> },
    { path: '/campus-tour', name: 'Campus Tour', icon: <Map className="w-5 h-5" /> },
    { path: '/discussions', name: 'Discussions', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-campus-purple">Campus<span className="text-foreground">Nexus</span></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <ThemeModeToggle />
            
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0">
                    <Avatar>
                      <AvatarImage src={userProfile?.photoURL || undefined} />
                      <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="font-medium">{userProfile?.displayName}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[12rem]">{userProfile?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {userProfile?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={signInWithGoogle}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
