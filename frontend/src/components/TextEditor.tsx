import React from "react";

interface TextEditorProps {
  isOpen: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({ isOpen }) => {
  if (!isOpen) return null; // Returns nothing if not open

  return (
    <div>
      <input defaultValue="Hello world" />
    </div>
  );
};

export default TextEditor;

