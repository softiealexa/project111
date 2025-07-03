'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  
  const getAvatarFallback = () => {
      if (!user) return 'U';
      return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpenCheck className="h-7 w-7" />
            <span className="font-headline text-2xl font-bold">Trackademic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={''} alt={user.displayName || 'User'} />
                       <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <div className="flex items-center gap-2">
                    {pathname !== '/login' && (
                        <Button asChild variant="ghost">
                            <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                            </Link>
                        </Button>
                    )}
                    {pathname !== '/register' && (
                        <Button asChild>
                            <Link href="/register">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign Up
                            </Link>
                        </Button>
                    )}
               </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
