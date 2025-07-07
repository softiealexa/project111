
"use client";

import { useState, useEffect } from "react";
import Joyride, { type Step, CallBackProps, STATUS } from "react-joyride";
import { useData } from "@/contexts/data-context";

export default function OnboardingTour() {
  const { activeProfile, completeOnboarding, mode } = useData();
  const [run, setRun] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Now, we only attempt to run the tour if we are on the client
    // and the other conditions are met.
    if (isClient && activeProfile && !activeProfile.hasCompletedOnboarding && activeProfile.subjects.length > 0) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500); 
      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [isClient, activeProfile]);

  const steps: Step[] = [
    {
      target: "body",
      content: "Welcome to TrackAcademic! Let's take a quick tour of the main features.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="subject-tabs-list"]',
      content: "Here you can see all your subjects. Click on a subject to view its chapters and track your progress.",
      placement: 'bottom',
    },
    {
      target: '[data-tour="main-tabs-list"]',
      content: "You can switch between your subjects, see a progress overview, or access helpful study tools.",
      placement: 'bottom',
    },
    {
      target: "#customization-button",
      content: "Click here to open the customization panel. You can add subjects, manage chapters, define repeatable tasks, and change the app's theme.",
      placement: 'bottom',
    },
    {
      target: "#profile-dropdown-trigger",
      content: "Access your profile settings, import or export your data, toggle dark/light mode, and log out from here.",
      placement: 'bottom-end',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      completeOnboarding();
    }
  };
  
  // If we're not on the client yet, render nothing.
  // This ensures the server and initial client render match.
  if (!isClient) {
    return null;
  }

  return (
    <Joyride
      run={run}
      steps={steps}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: mode === "dark" ? "#334155" : "#fff",
          backgroundColor: mode === "dark" ? "#334155" : "#fff",
          primaryColor: "hsl(var(--primary))",
          textColor: mode === "dark" ? "#f8fafc" : "#020817",
        },
        buttonClose: {
          display: "none",
        },
        spotlight: {
          borderRadius: '0.75rem'
        }
      }}
    />
  );
}
