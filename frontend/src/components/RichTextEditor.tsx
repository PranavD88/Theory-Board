import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const RichTextEditor: React.FC<{
  content: string;
  onChange: (html: string) => void;
}> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your note here...",
      }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable) {
      editor.commands.focus();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      style={{
        width: "99%",
        height: "150px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        background: "#fff",
        overflowY: "auto",
        display: "block",
        textAlign: "left",
      }}
    >
      <EditorContent
        editor={editor}
        style={{
          height: "100%",
        }}
      />
      <style>
        {`
          .ProseMirror {
            outline: none;
            padding: 4px 9px;
            min-height: 100%;
            height: 100%;
            font-size: 14px;
            color: #000;
            box-sizing: border-box;
            white-space: pre-wrap !important;
            overflow-y: auto;
            text-align: left !important;
            display: block;
            vertical-align: top;
            line-height: 1.4;
          }

          .ProseMirror p {
            margin: 0;
          }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
