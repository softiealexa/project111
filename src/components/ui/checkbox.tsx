
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CheckedState as CustomCheckedState } from "@/lib/types";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> & {
    checked: CustomCheckedState;
    onCheckedChange: (status: CustomCheckedState) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  
  const handleStateChange = () => {
     if (checked.status === 'checked') {
        onCheckedChange({ status: 'checked-red', completedAt: checked.completedAt || Date.now() });
     } else if (checked.status === 'checked-red') {
        onCheckedChange({ status: 'unchecked' });
     } else { // 'unchecked'
        onCheckedChange({ status: 'checked', completedAt: Date.now() });
     }
  };

  const isChecked = checked.status === 'checked' || checked.status === 'checked-red'
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={isChecked}
      onCheckedChange={handleStateChange}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-full border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:text-primary-foreground",
        checked.status === 'checked' && "bg-primary border-primary",
        checked.status === 'checked-red' && "bg-destructive border-destructive",
        checked.status === 'unchecked' && "border-primary",
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
