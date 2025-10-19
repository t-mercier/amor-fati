"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";

interface InputBarProps {
  onSend: (value: string) => void;
  onSkip?: () => void;
  canSkip?: boolean;
  placeholder?: string;
  helper?: string;
  disabled?: boolean;
  inputType?: "text" | "number";
}

export default function InputBar({
  onSend,
  onSkip,
  canSkip = false,
  placeholder = "Type your answer...",
  helper,
  disabled = false,
  inputType = "text",
}: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input when it's enabled
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      setValue("");
    }
  };

  return (
    <div className="border-t border-af-lilac/20 bg-white p-4">
      {helper && (
        <p className="text-xs text-af-ink/60 mb-2" id="input-helper">
          {helper}
        </p>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            aria-label="Your answer"
            aria-describedby={helper ? "input-helper" : undefined}
            className="w-full px-4 py-3 rounded-xl border-2 border-af-lilac/40 focus:border-af-lilac focus:outline-none focus:ring-2 focus:ring-af-lilac/20 transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <p className="text-xs text-af-ink/50 mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
        <div className="flex gap-2">
          {canSkip && onSkip && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={disabled}
              className="px-4 py-3 rounded-xl border-2 border-af-lilac/40 text-af-ink/70 hover:bg-af-lilac/10 transition disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label="Skip this question"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            aria-label="Send your answer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

