interface BubbleProps {
  role: "bot" | "user";
  text: string;
  isTyping?: boolean;
}

export default function Bubble({ role, text, isTyping }: BubbleProps) {
  if (isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%] px-5 py-3 rounded-3xl bg-af-lilac/30 shadow-sm">
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-af-ink/40 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-af-ink/40 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-af-ink/40 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  const isBot = role === "bot";
  const bubbleClass = isBot
    ? "bg-af-lilac/30 text-af-ink rounded-3xl rounded-tl-md"
    : "bg-gradient-to-r from-af-pink/40 to-af-lilac/40 text-af-ink rounded-3xl rounded-tr-md";

  return (
    <div
      className={`flex mb-4 ${isBot ? "justify-start" : "justify-end"}`}
      role="log"
      aria-live="polite"
    >
      <div
        className={`max-w-[80%] px-5 py-3 shadow-md ${bubbleClass} whitespace-pre-wrap break-words`}
      >
        {text}
      </div>
    </div>
  );
}

