import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSubmit?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, onSubmit, leftElement, rightElement, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [initialHeight, setInitialHeight] = React.useState<number>(0);

    React.useEffect(() => {
      if (textareaRef.current && !initialHeight) {
        setInitialHeight(textareaRef.current.clientHeight);
      }
    }, [initialHeight]);

    const handleInput = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * 5; // Limit to 5 lines
        
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        
        if (textarea.scrollHeight > maxHeight) {
          textarea.style.overflowY = 'auto';
        } else {
          textarea.style.overflowY = 'hidden';
        }
        
        // Calculate footer height including all elements
        const isMobile = window.innerWidth <= 768;
        const safeAreaInset = isMobile ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0') : 0;
        const footerPadding = isMobile ? 16 : 32;
        const streamingStatusHeight = 24;
        
        const footerHeight = newHeight + footerPadding + streamingStatusHeight + safeAreaInset;
        document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
        
        // Adjust main content padding on mobile
        if (isMobile) {
          document.querySelector('main')?.style.setProperty(
            'padding-bottom',
            `${footerHeight + 16}px`
          );
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (onSubmit && e.currentTarget.value.trim()) {
          onSubmit(e);
          // Reset height after submission
          if (textareaRef.current) {
            const isMobile = window.innerWidth <= 768;
            const baseHeight = isMobile ? 40 : initialHeight;
            textareaRef.current.style.height = `${baseHeight}px`;
            
            // Reset footer height with mobile considerations
            const footerHeight = isMobile ? 80 : 80;
            document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
            
            // Reset main content padding on mobile
            if (isMobile) {
              document.querySelector('main')?.style.setProperty(
                'padding-bottom',
                `${footerHeight + 16}px`
              );
            }
          }
        }
      }
    };

    return (
      <div ref={containerRef} className="relative flex items-end w-full">
        {leftElement && (
          <div className="absolute left-2 flex items-center h-full">
            {leftElement}
          </div>
        )}
        <textarea
          className={cn(
            "flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm",
            "ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none",
            "focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[40px] resize-none overflow-y-auto",
            leftElement && "pl-10",
            rightElement && "pr-20",
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
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 flex items-center h-full">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
