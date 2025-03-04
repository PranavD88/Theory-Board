import React from "react";

interface TextEditorProps {
    isOpen: boolean;
  }
  
  const TextEditor: React.FC<TextEditorProps> = ({ isOpen }) => {
    if (isOpen) {
        console.log("Opened Text Editor");
      return (
        <div>
            <input defaultValue="Hello world" />
        </div>
      
    );
    } else {
      return null; // Return nothing if the editor is not open
    }
  };
export default TextEditor