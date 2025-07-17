
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/data-context";
import { DownloadCloud, PartyPopper } from "lucide-react";
import { getISOWeek, getYear } from 'date-fns';

const PROGRESS_DOWNLOAD_PROMPT_KEY = 'trackacademic_progress_prompt';

export default function ProgressDownloadDialog() {
  const { showProgressDownloadPrompt, setShowProgressDownloadPrompt, exportData } = useData();

  const handleClose = () => {
    const today = new Date();
    const currentWeekId = `${getYear(today)}-${getISOWeek(today)}`;
    localStorage.setItem(PROGRESS_DOWNLOAD_PROMPT_KEY, currentWeekId);
    setShowProgressDownloadPrompt(false);
  };

  const handleDownload = () => {
    exportData();
    handleClose();
  };

  return (
    <AlertDialog open={showProgressDownloadPrompt} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <PartyPopper className="h-9 w-9 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">Happy Sunday!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You've made it through another week. It's a great time to back up your progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center pt-2">
          <AlertDialogCancel onClick={handleClose}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleDownload}>
            <DownloadCloud className="mr-2 h-4 w-4" />
            Download Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
