"use client";
import * as React from "react";
import { Dialog as Primitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "cn";
const Dialog = Primitive.Root,
  DialogTrigger = Primitive.Trigger,
  DialogClose = Primitive.Close,
  DialogPortal = Primitive.Portal;
function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Primitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-black/30" />
      <Primitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-popover p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Primitive.Close
            aria-label="Close dialog"
            className="absolute right-3 top-3 p-1"
          >
            <X size={16} />
          </Primitive.Close>
        )}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
const DialogTitle = Primitive.Title,
  DialogDescription = Primitive.Description,
  DialogOverlay = Primitive.Overlay;
const DialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("space-y-2", className)} {...props} />
);
const DialogFooter = DialogHeader;
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
};
