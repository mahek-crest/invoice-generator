"use client";
import * as React from "react";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "cn";
const Tabs = Primitive.Root;
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn("inline-flex gap-1 rounded bg-muted p-1", className)}
      {...props}
    />
  );
}
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "rounded px-5 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
const TabsContent = Primitive.Content;
export { Tabs, TabsList, TabsTrigger, TabsContent };
