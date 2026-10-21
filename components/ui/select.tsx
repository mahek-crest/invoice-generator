"use client";
import * as React from "react";
import { Select as Primitive } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "cn";
const Select = Primitive.Root,
  SelectValue = Primitive.Value,
  SelectGroup = Primitive.Group;
function SelectTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between rounded border border-input bg-white px-2.5 text-xs",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.Icon>
        <ChevronDown size={14} />
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}
function SelectContent({
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        position="popper"
        sideOffset={4}
        className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border bg-popover p-1 shadow-lg"
        {...props}
      >
        <Primitive.Viewport>{children}</Primitive.Viewport>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
function SelectItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        "flex cursor-default items-center justify-between gap-4 rounded px-3 py-2 text-xs outline-none data-[highlighted]:bg-accent",
        className,
      )}
      {...props}
    >
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator>
        <Check size={13} />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
};
