'use client';

import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Book, Download, Upload, ChevronsUpDown, Check, LogOut, UserPlus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddProfileDialog } from './add-profile-dialog';
import { CustomizationSheet } from './customization-sheet';
import Image from 'next/image';

export default function Navbar() {
  const { profiles, activeProfile, switchProfile, exportData, importData, user, signOutUser } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  }

  return (
    <header suppressHydrationWarning className="bg-background/80 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors">
            <Book className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-bold bg-gradient-to-r from-primary via-foreground/90 to-primary bg-clip-text text-transparent">
              TrackAcademic
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <CustomizationSheet />
            {user ? (
              <>
                {activeProfile && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-auto sm:w-[180px] justify-between">
                        <span className="truncate">{activeProfile.name}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[180px]">
                        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {profiles.map((profile) => (
                        <DropdownMenuItem key={profile.name} onSelect={() => switchProfile(profile.name)}>
                            <Check className={`mr-2 h-4 w-4 ${activeProfile.name === profile.name ? 'opacity-100' : 'opacity-0'}`} />
                            {profile.name}
                        </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <AddProfileDialog />
                    </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                />
                
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
                      <div className="flex flex-col">
                        <p className="text-lg font-semibold leading-none text-foreground">{user.displayName}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleImportClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Import Data</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportData}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Export Data</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
  );
}
