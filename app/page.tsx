"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat immediately
    router.push("/chat");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-af-sky/10 via-af-lilac/5 to-af-pink/10 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-af-ink mb-4">Amor Fati 💫</h1>
        <p className="text-lg text-af-ink/80 mb-6">
          Redirecting to your reflection conversation...
        </p>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-af-lilac border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
