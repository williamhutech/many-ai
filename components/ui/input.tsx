import * as React from "react"
import { createEditor, Descendant, Element as SlateElement, Text, BaseEditor, Node, Range, Editor, Transforms, NodeEntry } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import { cn } from "@/lib/utils"

// Define custom types for Slate
type CustomText = { 
  text: string;
  highlight?: boolean;
  prefix?: string;
}

type CustomElement = { 
  type: 'paragraph' | 'mention';
  children: CustomText[];
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor & {
      placeholder?: string;
    }
    Element: CustomElement
    Text: CustomText
  }
}

export interface InputProps {
  className?: string;
  onSubmit?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

const withMentions = (editor: BaseEditor & ReactEditor & HistoryEditor) => {
  const { isInline, markableVoid } = editor;

  editor.isInline = (element: SlateElement) => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.markableVoid = (element: SlateElement) => {
    return element.type === 'mention' || markableVoid(element);
  };

  return editor;
};

const Input = React.forwardRef<HTMLDivElement, InputProps>(
  ({ className, onSubmit, leftElement, rightElement, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const editor = React.useMemo(() => {
      return withMentions(withHistory(withReact(createEditor())));
    }, []);

    const [value, setValue] = React.useState<Descendant[]>([
      {
        type: "paragraph",
        children: [{ text: props.value || "" }],
      } as CustomElement,
    ]);

    const decorate = React.useCallback(([node, path]: NodeEntry<Node>) => {
      const ranges: Range[] = [];

      if (!Text.isText(node) || !node.text) {
        return ranges;
      }

      const { text } = node;
      const pattern = /([#@])\w+\b/g;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        if (match.index !== undefined) {
          const start = match.index;
          const end = start + match[0].length;

          const anchor = { path, offset: start };
          const focus = { path, offset: end };

          if (Editor.string(editor, { anchor, focus })) {
            ranges.push({
              anchor,
              focus,
              highlight: true,
              prefix: match[1],
            } as Range & { highlight: boolean; prefix: string });
          }
        }
      }

      return ranges;
    }, [editor]);

    React.useEffect(() => {
      try {
        const newValue: CustomElement[] = [
          {
            type: "paragraph",
            children: [{ text: props.value || "" }],
          },
        ];
        setValue(newValue);
      } catch (error) {
        console.error("Error updating editor value:", error);
      }
    }, [props.value]);

    const renderElement = React.useCallback((elementProps: RenderElementProps) => {
      return <p {...elementProps.attributes}>{elementProps.children}</p>;
    }, []);

    const renderLeaf = React.useCallback((leafProps: RenderLeafProps) => {
      const { attributes, children, leaf } = leafProps as RenderLeafProps & { leaf: CustomText };

      if (leaf.highlight) {
        return (
          <span
            {...attributes}
            className={cn(
              leaf.prefix === "@" && "text-purple-600",
              leaf.prefix === "#" && "text-blue-600"
            )}
          >
            {children}
          </span>
        );
      }
      return <span {...attributes}>{children}</span>;
    }, []);

    const handleChange = (newValue: Descendant[]) => {
      setValue(newValue);
      Editor.normalize(editor, { force: true });

      const plainText = newValue
        .map(n => {
          if (SlateElement.isElement(n)) {
            return n.children.map(c => Text.isText(c) ? c.text : '').join('');
          }
          return '';
        })
        .join('\n');
      
      props.onChange?.({ target: { value: plainText } });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        if (!e.shiftKey) {
          e.preventDefault();
          onSubmit?.(e);

          // Clear
          Transforms.delete(editor, { at: Editor.range(editor, []) });
          setValue([
            {
              type: "paragraph",
              children: [{ text: "" }],
            } as CustomElement,
          ]);
          ReactEditor.focus(editor);
          Transforms.select(editor, { path: [0, 0], offset: 0 });
        } else {
          e.preventDefault();
          editor.insertText('\n');
        }
      }
      props.onKeyDown?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (props.disabled) return;
      const text = e.clipboardData.getData('text');
      const selection = editor.selection;
      if (selection) {
        e.preventDefault();
        Editor.insertText(editor, text);
      }
    };

    // Remove disclaimers from the finalFooterHeight calculation to reduce spacing
    const updateFooterHeight = React.useCallback(() => {
      if (typeof window === 'undefined') return;
      
      const container = containerRef.current;
      if (!container) return;
      
      const editableDiv = container.querySelector('[data-slate-editor="true"]') as HTMLElement;
      if (!editableDiv) return;
      
      const computedStyle = window.getComputedStyle(editableDiv);
      const lineHeight = parseInt(computedStyle.lineHeight);
      const maxLines = 4;
      const maxEditorHeight = lineHeight * maxLines;
      
      editableDiv.style.overflowY = editableDiv.scrollHeight > maxEditorHeight ? 'auto' : 'hidden';
      
      const footer = document.querySelector('footer');
      if (!footer) return;

      const isMobile = window.innerWidth <= 768;
      const footerPadding = isMobile ? 4 : 16;
      const baseFooterHeight = isMobile ? 60 : 80;
      const spacingBetween = isMobile ? 2 : 8;

      // Excluding any "disclaimerHeight" from finalFooterHeight so it won’t push everything up:
      const newFooterHeight = Math.max(
        baseFooterHeight,
        Math.min(editableDiv.scrollHeight, maxEditorHeight) +
          footerPadding +
          spacingBetween
      );

      const maxFooterHeight = window.innerHeight * 0.4;
      const finalFooterHeight = Math.min(newFooterHeight, maxFooterHeight);

      requestAnimationFrame(() => {
        footer.style.minHeight = `${finalFooterHeight}px`;
      });
    }, []);

    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(updateFooterHeight);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, [updateFooterHeight]);

    React.useEffect(() => {
      if (typeof window === 'undefined') return;

      const handleResize = () => {
        requestAnimationFrame(() => {
          updateFooterHeight();
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [updateFooterHeight]);

    return (
      <div className="relative flex items-end w-full" ref={ref}>
        <Slate editor={editor} initialValue={value} onChange={handleChange}>
          <div ref={containerRef} className="relative w-full input-container">
            <div className="relative flex items-center">
              {leftElement && (
                <div className="absolute left-3 flex items-center h-full z-10">
                  {leftElement}
                </div>
              )}

              <Editable
                className={cn(
                  "w-full bg-white text-sm rounded-lg border",
                  "px-12 py-3",
                  "leading-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:border-zinc-200 hover:border-zinc-100",
                  props.disabled && "bg-[#F7F7F8] text-zinc-600",
                  className
                )}
                placeholder={props.placeholder}
                readOnly={props.disabled}
                decorate={decorate}
                renderLeaf={renderLeaf}
                renderElement={renderElement}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowX: "hidden",
                  overflowY: "auto",
                  maxHeight: "calc(1.5rem * 3 + 1.5rem)",
                  paddingRight: "20px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
                  minHeight: "52px",
                  display: "flex",
                  alignItems: "center"
                }}
              />

              {rightElement && (
                <div className="absolute right-3 flex items-center h-full z-10">
                  {rightElement}
                </div>
              )}
            </div>
          </div>
        </Slate>
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
