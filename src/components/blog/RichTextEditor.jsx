import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange, onCursorChange, placeholder }) {
  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link'
  ];

  const handleChange = (content, delta, source, editor) => {
    onChange(content);
    
    // Track cursor position
    if (onCursorChange && quillRef.current) {
      const selection = editor.getSelection();
      if (selection) {
        onCursorChange(selection.index);
      }
    }
  };

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          border: none;
          font-size: 16px;
          line-height: 1.8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 400px;
          padding: 0;
        }
        
        .rich-text-editor .ql-editor h1 {
          font-size: 2.25em;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .rich-text-editor .ql-editor h2 {
          font-size: 1.75em;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .rich-text-editor .ql-editor h3 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1.25em;
          margin-bottom: 0.5em;
        }
        
        .rich-text-editor .ql-editor h4 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .rich-text-editor .ql-editor p {
          margin-bottom: 1.25em;
        }
        
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #64748b;
        }
        
        .rich-text-editor .ql-editor pre {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1em;
          overflow-x: auto;
        }
        
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
          margin-bottom: 1.25em;
        }
        
        .rich-text-editor .ql-toolbar {
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          background: white;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #cbd5e1;
          font-style: normal;
        }
      `}</style>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}