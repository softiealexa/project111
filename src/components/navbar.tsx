'use client';

import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, Download, Upload, User } from 'lucide-react';
import { useRef } from 'react';

export default function Navbar() {
  const { nickname, exportData, importData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
    // Reset file input to allow importing the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-card/80 border-b border-border backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpenCheck className="h-7 w-7" />
            <span className="font-headline text-2xl font-bold">Trackademic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {nickname && (
              <>
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{nickname}</span>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                />
                <Button variant="outline" size="sm" onClick={handleImportClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
                <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
