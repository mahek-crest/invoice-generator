"use client";
import * as React from "react";
import { Switch as Primitive } from "radix-ui";
import { cn } from "cn";
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "h-5 w-9 shrink-0 rounded-full bg-slate-400 data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <Primitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white data-[state=checked]:translate-x-[18px]" />
    </Primitive.Root>
  );
}
export { Switch };
