
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/lib/types";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange'> & {
    checked: TaskStatus;
    onCheckedChange: (status: TaskStatus) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  
  const handleStateChange = () => {
    if (checked === 'checked') {
      onCheckedChange('checked-red');
    } else if (checked === 'checked-red') {
      onCheckedChange('unchecked');
    } else { // 'unchecked'
      onCheckedChange('checked');
    }
  };

  const isChecked = checked === 'checked' || checked === 'checked-red';

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={isChecked}
      onCheckedChange={handleStateChange}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-full border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:text-primary-foreground",
        checked === 'checked' ? "bg-primary border-primary" :
        checked === 'checked-red' ? "bg-destructive border-destructive" :
        "border-primary",
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
