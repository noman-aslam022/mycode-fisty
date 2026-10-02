import { useRef, useState } from "react";

interface PhotoPanelProps {
  photo: string | null;
  onPhoto: (file: File) => void;
  onClear: () => void;
  highlight: boolean;
}

export default function PhotoPanel({ photo, onPhoto, onClear, highlight }: PhotoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onPhoto(file);
  };

  return (
    <div
      className={`h-full rounded-3xl bg-background-50 p-5 md:p-6 flex flex-col transition-all duration-300 ${
        highlight ? "ring-2 ring-primary-500" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.16em] text-foreground-500">
          <span className="w-6 h-6 rounded-full bg-foreground-950 text-background-50 flex items-center justify-center text-[10px] font-bold">
            01
          </span>
          Your photo
        </span>
        {photo && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-foreground-500 hover:text-foreground-900 transition-colors cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative w-full flex-1 min-h-[320px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed transition-colors bg-background-100 ${
          dragging ? "border-primary-500" : "border-background-300"
        }`}
      >
        {photo ? (
          <img
            src={photo}
            alt="Your uploaded photo"
            title="Your photo"
            className="w-full h-full object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 cursor-pointer group"
          >
            <span className="w-16 h-16 rounded-full bg-background-200 group-hover:bg-primary-500 transition-colors flex items-center justify-center mb-4">
              <i className="ri-add-line text-3xl text-foreground-800 group-hover:text-foreground-950"></i>
            </span>
            <p className="font-heading font-bold text-lg text-foreground-950">
              Upload a full-body photo
            </p>
            <p className="text-sm text-foreground-500 mt-2">
              Drag &amp; drop or click to browse. JPG or PNG.
            </p>
          </button>
        )}

        {photo && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 right-3 h-10 px-4 rounded-full bg-foreground-950 text-background-50 text-sm font-medium hover:bg-foreground-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-1.5"></i> Change
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-2 text-xs text-foreground-500">
        <li className="flex items-center gap-2">
          <i className="ri-lock-line text-accent-600"></i> Never stored — sent securely per try-on
        </li>
        <li className="flex items-center gap-2">
          <i className="ri-shield-check-line text-accent-600"></i> Used only to generate your look
        </li>
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}