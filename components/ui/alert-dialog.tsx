"use client";
import * as React from "react";
import { AlertDialog as Primitive } from "radix-ui";
import { Button } from "./button";
const AlertDialog = Primitive.Root,
  AlertDialogTrigger = Primitive.Trigger;
function AlertDialogContent({
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-black/30" />
      <Primitive.Content
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded bg-popover p-6 shadow-xl space-y-4"
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
const AlertDialogTitle = Primitive.Title,
  AlertDialogDescription = Primitive.Description;
function AlertDialogCancel(props: React.ComponentProps<typeof Button>) {
  return (
    <Primitive.Cancel asChild>
      <Button variant="outline" {...props} />
    </Primitive.Cancel>
  );
}
// Async deletion closes only after success; keep the dialog open while it runs.
const AlertDialogAction = Button;
const AlertDialogFooter = (props: React.ComponentProps<"div">) => (
  <div className="flex justify-end gap-2" {...props} />
);
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
};
