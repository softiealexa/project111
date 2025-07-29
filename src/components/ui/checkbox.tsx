
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CheckedState as CustomCheckedState, SimpleTodo } from "@/lib/types";

// This component can now accept a complex object for state, but still work with simple booleans
type CheckedProp = CustomCheckedState | boolean | SimpleTodo;

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> & {
    checked: CheckedProp;
    onCheckedChange: (status: CustomCheckedState | boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  
  const handleStateChange = () => {
    if (typeof checked === 'boolean') {
      onCheckedChange(!checked);
      return;
    }
    
    // Assumes it's a CustomCheckedState or SimpleTodo object
    const currentStatus = (checked as any).status;

     if (currentStatus === 'checked') {
        onCheckedChange({ status: 'checked-red', completedAt: (checked as any).completedAt || Date.now() });
     } else if (currentStatus === 'checked-red') {
        onCheckedChange({ status: 'unchecked' });
     } else { // 'unchecked'
        onCheckedChange({ status: 'checked', completedAt: Date.now() });
     }
  };

  let isChecked: boolean;
  let currentStatus: 'checked' | 'checked-red' | 'unchecked';

  if (typeof checked === 'boolean') {
      isChecked = checked;
      currentStatus = checked ? 'checked' : 'unchecked';
  } else {
      currentStatus = (checked as any).status;
      isChecked = currentStatus === 'checked' || currentStatus === 'checked-red';
  }
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={isChecked}
      onCheckedChange={handleStateChange}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-full border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:text-primary-foreground",
        currentStatus === 'checked' && "bg-primary border-primary",
        currentStatus === 'checked-red' && "bg-destructive border-destructive",
        currentStatus === 'unchecked' && "border-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {isChecked && <Check className="h-4 w-4" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
