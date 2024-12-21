import * as React from "react"
import { createEditor, Descendant, Element as SlateElement, Text, BaseEditor, Node, Range, Editor, Transforms } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import { cn } from "@/lib/utils"
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from 'slate-react';

// Define custom types for Slate
type CustomText = { 
  text: string;
  highlight?: boolean;
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

// Type guard for CustomElement
const isCustomElement = (node: Node): node is CustomElement => {
  return SlateElement.isElement(node) && 'type' in node && node.type === 'paragraph';
};

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

  editor.isInline = element => {
    return (element as CustomElement).type === 'mention' ? true : isInline(element);
  };

  editor.markableVoid = element => {
    return (element as CustomElement).type === 'mention' || markableVoid(element);
  };

  return editor;
};

const Input = React.forwardRef<HTMLDivElement, InputProps>(
  ({ className, onSubmit, leftElement, rightElement, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [defaultLines, setDefaultLines] = React.useState(2); // Default to desktop
    
    const editor = React.useMemo(() => {
      return withMentions(withHistory(withReact(createEditor())));
    }, []);

    // Move window check to useEffect
    React.useEffect(() => {
      if (typeof window !== 'undefined') {
        setDefaultLines(window.innerWidth <= 768 ? 3 : 2);
        
        const handleResize = () => {
          setDefaultLines(window.innerWidth <= 768 ? 3 : 2);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    }, []);

    const [value, setValue] = React.useState<Descendant[]>([{
      type: 'paragraph',
      children: [{ text: props.value || '' }]
    }]);

    const decorate = React.useCallback(([node, path]: [Node, number[]]) => {
      const ranges: Range[] = [];

      if (!Text.isText(node) || !node.text) {
        return ranges;
      }

      const { text } = node;
      
      // Match words starting with @ or #
      const pattern = /([#@])\w+\b/g;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        if (match.index !== undefined) {
          const start = match.index;
          const end = start + match[0].length;
          
          // Create range only if path is valid
          if (path && Array.isArray(path)) {
            const range = {
              anchor: { path, offset: start },
              focus: { path, offset: end },
              highlight: true,
              prefix: match[1] // Store @ or # for styling
            } as Range & { highlight: boolean; prefix: string };

            // Validate range before adding
            if (Editor.string(editor, range)) {
              ranges.push(range);
            }
          }
        }
      }

      return ranges;
    }, [editor]);

    React.useEffect(() => {
      try {
        const newValue = [{
          type: 'paragraph' as const,
          children: [{ text: props.value || '' }]
        }];
        setValue(newValue);
        
        // Reset height when value is cleared
        if (!props.value && containerRef.current) {
          const lineHeight = parseInt(window.getComputedStyle(containerRef.current).lineHeight);
          const defaultHeight = lineHeight * defaultLines;
          containerRef.current.style.height = `${defaultHeight}px`;
        }
        
        // Only set selection if editor has focus
        if (ReactEditor.isFocused(editor)) {
          const point = { path: [0, 0], offset: (props.value || '').length };
          editor.selection = { anchor: point, focus: point };
        }
      } catch (error) {
        console.error('Error updating editor value:', error);
      }
    }, [props.value, editor, defaultLines]);

    const renderElement = React.useCallback((props: RenderElementProps) => {
      return <p {...props.attributes}>{props.children}</p>
    }, []);

    const renderLeaf = React.useCallback(({ attributes, children, leaf }: RenderLeafProps & {
      leaf: {
        highlight?: boolean;
        prefix?: string;
      }
    }) => {
      if (leaf.highlight) {
        return (
          <span 
            {...attributes} 
            className={cn(
              leaf.prefix === '@' && "text-purple-600",
              leaf.prefix === '#' && "text-blue-600"
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
      
      // Normalize the value to ensure valid state
      Editor.normalize(editor, { force: true });
      
      const plainText = newValue
        .map(n => SlateElement.isElement(n) ? n.children.map(c => Text.isText(c) ? c.text : '').join('') : '')
        .join('\n');
      props.onChange?.({ target: { value: plainText } });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.(e);
        
        // Clear content using normalized Transforms
        Transforms.delete(editor, {
          at: Editor.range(editor, []),
        });
        
        // Reset the editor state properly
        setValue([{ 
          type: 'paragraph',
          children: [{ text: '' }]
        }]);
        
        // Ensure proper focus and selection
        ReactEditor.focus(editor);
        Transforms.select(editor, { path: [0, 0], offset: 0 });
      }
      props.onKeyDown?.(e);
    };

    const renderPlaceholder = React.useCallback(({ attributes, children }: RenderPlaceholderProps) => {
      const style: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9ca3af',
        pointerEvents: 'none',
        display: 'inline-block',
        width: 'calc(100% - 6rem)',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        opacity: Editor.string(editor, []) ? 0 : 1,
        transition: 'opacity 0.2s'
      };

      return (
        <span {...attributes} style={style}>
          {children}
        </span>
      );
    }, [editor]);

    return (
      <div className="relative flex items-end w-full">
        <Slate editor={editor} initialValue={value} onChange={handleChange}>
          <div ref={containerRef} className="relative w-full">
            <div className="relative flex items-center">
              {/* Left element (attachment button) */}
              {leftElement && (
                <div className="absolute left-3 flex items-center h-full z-10">
                  {leftElement}
                </div>
              )}
              
              <Editable
                className={cn(
                  "w-full bg-white text-sm",
                  "rounded-lg border",
                  "px-12 py-3",
                  "min-h-[52px]",
                  "resize-none overflow-y-auto leading-6",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:border-zinc-200",
                  "hover:border-zinc-100",
                  props.disabled && "bg-[#F7F7F8] text-zinc-600",
                  className
                )}
                placeholder={props.placeholder}
                readOnly={props.disabled}
                decorate={decorate}
                renderLeaf={renderLeaf}
                renderPlaceholder={renderPlaceholder}
                onKeyDown={handleKeyDown}
              />
              
              {/* Right element (submit button) */}
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
