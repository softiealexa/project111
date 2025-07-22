
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CheckedState as CustomCheckedState } from "@/lib/types";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> & {
    checked: boolean | CustomCheckedState;
    onCheckedChange: (status: boolean | CustomCheckedState) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  
  const isCustomState = typeof checked === 'object' && checked !== null && 'status' in checked;

  const handleStateChange = () => {
    if (isCustomState) {
       const currentChecked = checked as CustomCheckedState;
       if (currentChecked.status === 'checked') {
          onCheckedChange({ status: 'checked-red', completedAt: currentChecked.completedAt || Date.now() });
       } else if (currentChecked.status === 'checked-red') {
          onCheckedChange({ status: 'unchecked' });
       } else { // 'unchecked'
          onCheckedChange({ status: 'checked', completedAt: Date.now() });
       }
    } else {
        // Simple boolean toggle
        onCheckedChange(!checked);
    }
  };

  const isChecked = isCustomState
    ? (checked as CustomCheckedState).status === 'checked' || (checked as CustomCheckedState).status === 'checked-red'
    : !!checked;
  
  const status = isCustomState ? (checked as CustomCheckedState).status : (isChecked ? 'checked' : 'unchecked');
  
  const isSimpleCheckbox = !isCustomState;

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={isChecked}
      onCheckedChange={handleStateChange}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:text-primary-foreground",
        status === 'checked' && "bg-primary border-primary",
        status === 'checked-red' && "bg-destructive border-destructive",
        status === 'unchecked' && "border-primary",
        isSimpleCheckbox && "rounded-sm",
        !isSimpleCheckbox && "rounded-full",
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
