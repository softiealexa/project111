
'use client';

import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Book, LogOut, UserPlus, LogIn, SlidersHorizontal, Settings, Clock, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomizationSheet } from './customization-sheet';
import Image from 'next/image';
import { Sheet, SheetTrigger } from './ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export default function Navbar() {
  const { activeProfile, user, signOutUser } = useData();
  const router = useRouter();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);


  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  }

  const handleCustomizationStateChange = (open: boolean) => {
    if (!open && document.activeElement instanceof HTMLElement) {
      // When closing, blur any active element to ensure onBlur save handlers trigger.
      document.activeElement.blur();
    }
    setIsCustomizationOpen(open);
  };

  return (
    <>
      <header suppressHydrationWarning className="bg-background/80 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard?tab=subjects" className="flex items-center gap-2 sm:gap-2.5 text-foreground hover:text-primary transition-colors">
              <Book className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="font-headline text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-foreground/90 to-primary bg-clip-text text-transparent">
                StudyTracker
              </span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <Sheet open={isCustomizationOpen} onOpenChange={handleCustomizationStateChange}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button asChild variant="ghost" size="icon">
                          <Link href="/notes">
                            <FileText className="h-5 w-5" />
                            <span className="sr-only">Notes</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notes</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button asChild variant="ghost" size="icon">
                          <Link href="/clockify">
                            <Clock className="h-5 w-5" />
                            <span className="sr-only">Clockify</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clockify</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={!activeProfile}>
                            <SlidersHorizontal className="h-5 w-5" />
                            <span className="sr-only">Customization</span>
                          </Button>
                        </SheetTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Customization</p>
                      </TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10">
                             {user.photoURL ? (
                              <Image src={user.photoURL} alt={user.displayName || 'user'} width={40} height={40} />
                            ) : (
                              <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold leading-none text-foreground">{user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">Student Profile</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => router.push('/notes')}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Notes</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => router.push('/clockify')}>
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Clockify</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsCustomizationOpen(true)} disabled={!activeProfile}>
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          <span>Customization</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <CustomizationSheet />
                  </Sheet>
                </>
              ) : (
                <div className="flex items-center gap-2">
                   <Button asChild variant="ghost">
                      <Link href="/login"><LogIn /> Login</Link>
                   </Button>
                   <Button asChild>
                      <Link href="/register"><UserPlus/> Register</Link>
                   </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
