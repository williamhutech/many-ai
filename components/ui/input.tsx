import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSubmit?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const Input = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, onSubmit, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 120; // Maximum height in pixels
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        
        // Update footer content height
        const footerContent = textarea.closest('footer');
        if (footerContent) {
          const extraHeight = newHeight - 40; // 40px is the base height
          footerContent.style.transform = `translateY(-${extraHeight}px)`;
        }
      }
    }, [props.value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const textarea = e.currentTarget;
        if (textarea.value.trim() && !textarea.value.includes('\n')) {
          e.preventDefault();
          onSubmit && onSubmit(e);
        }
      }
    };

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[40px] max-h-[120px] resize-none overflow-y-auto mobile-input",
          className
        )}
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }
          if (textareaRef.current) {
            (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }
        }}
        rows={1}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
