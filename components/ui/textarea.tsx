import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// Define the props for the Textarea component
export interface TextareaProps {
  value?: string;
  className?: string;
}

// Textarea component for rendering Markdown content
const Textarea = ({ value, className }: TextareaProps) => {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none min-h-[80px] w-full bg-white px-3 py-2 overflow-y-auto",
        "rounded-sm",
        "border-none",
        className
      )}
    >
      {/* Render the Markdown content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {value || ""}
      </ReactMarkdown>
    </div>
  );
};

export { Textarea };