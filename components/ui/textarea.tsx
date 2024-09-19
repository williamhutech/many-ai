import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export interface TextareaProps {
  value?: string;
  className?: string;
}

const Textarea = ({ value, className }: TextareaProps) => {
  return (
    // Use a div to display formatted content
    <div
      className={cn(
      "prose prose-sm max-w-none min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 overflow-y-auto",
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
