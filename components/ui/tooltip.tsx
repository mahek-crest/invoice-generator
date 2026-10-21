"use client";
import * as React from "react";
import { Tooltip as Primitive } from "radix-ui";
import { cn } from "cn";
const Tooltip = Primitive.Root,
  TooltipProvider = Primitive.Provider,
  TooltipTrigger = Primitive.Trigger;
function TooltipContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={6}
        className={cn(
          "z-50 max-w-60 rounded bg-foreground px-3 py-2 text-xs text-background shadow",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
