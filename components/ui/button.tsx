"use client";
import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] rounded-md border px-3 text-[11px] font-medium disabled:opacity-50 disabled:pointer-events-none transition-colors [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-transparent hover:opacity-90",
        outline: "border-border bg-background hover:bg-muted",
        ghost: "border-transparent hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive: "bg-destructive text-white border-transparent",
        link: "border-transparent text-primary underline",
      },
      size: {
        default: "h-[35px]",
        sm: "h-8 text-xs",
        xs: "h-7 text-xs",
        lg: "h-10",
        icon: "size-9 p-0",
        "icon-sm": "size-8 p-0",
        "icon-xs": "size-7 p-0",
        "icon-lg": "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  render,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    render?: React.ReactElement;
  }) {
  const Component = asChild ? Slot.Root : "button";
  if (render)
    return React.cloneElement(render, {
      ...props,
      className: cn(buttonVariants({ variant, size }), className),
    } as React.HTMLAttributes<HTMLElement>);
  return (
    <Component
      type="button"
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
export { Button, buttonVariants };
