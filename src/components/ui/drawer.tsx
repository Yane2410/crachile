import { Drawer as Vaul } from "vaul";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cra/cn";

export function Drawer(props: ComponentProps<typeof Vaul.Root>) {
  return <Vaul.Root {...props} />;
}

export function DrawerOverlay({ className, ...props }: ComponentProps<typeof Vaul.Overlay>) {
  return <Vaul.Overlay className={cn("fixed inset-0 z-50 bg-overlay", className)} {...props} />;
}

export function DrawerContent({ className, children, ...props }: ComponentProps<typeof Vaul.Content>) {
  return (
    <Vaul.Portal>
      <DrawerOverlay />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92vh] flex-col rounded-t-[var(--radius-xl)] bg-bg outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export const DrawerTitle = Vaul.Title;
export const DrawerDescription = Vaul.Description;
export const DrawerClose = Vaul.Close;
