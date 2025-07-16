"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, X } from "lucide-react"

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
      onCheckedChange('not-applicable');
    } else if (checked === 'not-applicable') {
      onCheckedChange('unchecked');
    } else {
      onCheckedChange('checked');
    }
  };

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=not-applicable]:bg-destructive/20 data-[state=not-applicable]:border-destructive/50 data-[state=not-applicable]:text-destructive",
        className
      )}
      data-state={checked}
      onClick={handleStateChange}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {checked === 'checked' && <Check className="h-4 w-4" />}
        {checked === 'not-applicable' && <X className="h-4 w-4" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
