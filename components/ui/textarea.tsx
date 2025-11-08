import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { componentSizes, DEFAULT_SIZE, type ComponentSize } from "@/lib/design-system/sizes";

const textareaVariants = cva(
  "flex w-full border border-input bg-background ring-offset-background placeholder:text-muted-foreground transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
  {
    variants: {
      size: {
        small: cn(
          componentSizes.textarea.small.minHeight,
          componentSizes.textarea.small.paddingX,
          componentSizes.textarea.small.paddingY,
          componentSizes.textarea.small.text,
          componentSizes.textarea.small.rounded
        ),
        medium: cn(
          componentSizes.textarea.medium.minHeight,
          componentSizes.textarea.medium.paddingX,
          componentSizes.textarea.medium.paddingY,
          componentSizes.textarea.medium.text,
          componentSizes.textarea.medium.rounded
        ),
        large: cn(
          componentSizes.textarea.large.minHeight,
          componentSizes.textarea.large.paddingX,
          componentSizes.textarea.large.paddingY,
          componentSizes.textarea.large.text,
          componentSizes.textarea.large.rounded
        ),
      },
    },
    defaultVariants: {
      size: DEFAULT_SIZE,
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };

