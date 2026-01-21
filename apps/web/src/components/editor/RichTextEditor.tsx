import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Quill modules configuration
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
}

// Quill formats configuration
const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list',
  'link', 'image'
]

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      
      {/* Custom styles for dark mode - using direct colors for reliability */}
      <style>{`
        .rich-text-editor {
          background: #0a0a0a;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .rich-text-editor .ql-toolbar.ql-snow {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 8px;
        }
        
        /* Make ALL toolbar icons white */
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #ffffff !important;
        }
        
        .rich-text-editor .ql-snow .ql-fill {
          fill: #ffffff !important;
        }
        
        .rich-text-editor .ql-snow .ql-picker {
          color: #ffffff !important;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label {
          color: #ffffff !important;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label::before {
          color: #ffffff !important;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label .ql-stroke {
          stroke: #ffffff !important;
        }
        
        /* Hover states - green accent */
        .rich-text-editor .ql-snow button:hover .ql-stroke,
        .rich-text-editor .ql-snow .ql-picker-label:hover .ql-stroke {
          stroke: #4ade80 !important;
        }
        
        .rich-text-editor .ql-snow button:hover .ql-fill,
        .rich-text-editor .ql-snow .ql-picker-label:hover .ql-fill {
          fill: #4ade80 !important;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label:hover,
        .rich-text-editor .ql-snow .ql-picker-label:hover::before {
          color: #4ade80 !important;
        }
        
        /* Active states */
        .rich-text-editor .ql-snow button.ql-active .ql-stroke {
          stroke: #4ade80 !important;
        }
        
        .rich-text-editor .ql-snow button.ql-active .ql-fill {
          fill: #4ade80 !important;
        }
        
        /* Editor container */
        .rich-text-editor .ql-container.ql-snow {
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 150px;
          font-size: 14px;
        }
        
        .rich-text-editor .ql-editor {
          color: #ffffff;
          min-height: 150px;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #888888;
          font-style: normal;
        }
        
        /* Dropdown menus */
        .rich-text-editor .ql-snow .ql-picker-options {
          background: #1a1a1a;
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .rich-text-editor .ql-snow .ql-picker-item {
          color: #ffffff;
        }
        
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          color: #4ade80;
        }
        
        /* Link tooltip */
        .rich-text-editor .ql-snow .ql-tooltip {
          background: #1a1a1a;
          border-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .rich-text-editor .ql-snow .ql-tooltip input[type=text] {
          background: #0a0a0a;
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
        
        .rich-text-editor .ql-snow .ql-tooltip a {
          color: #4ade80;
        }
      `}</style>
    </div>
  )
}
