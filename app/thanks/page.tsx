import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-af-sky/10 via-af-lilac/5 to-af-pink/10 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-af-ink mb-4">Thank You! ✨</h1>
        <p className="text-lg text-af-ink/80 mb-6">
          Your reflection has been successfully submitted. We appreciate your valuable input and honesty!
        </p>
        <p className="text-sm text-af-ink/60 mb-6">
          This sisterhood grows through every story shared, every idea voiced, and every connection made.
        </p>
        <a
          href="https://www.linkedin.com/groups/15481053/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-af-pink to-af-lilac text-af-ink font-bold shadow-lg hover:shadow-xl transition-all"
        >
          Join the LinkedIn Group →
        </a>
      </div>
    </div>
  );
}
