"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "success" | "error">(
    "checking"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("No token provided");
      return;
    }

    fetch(`/api/auth/magic?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setTimeout(() => router.push("/profile"), 1500);
        } else {
          setStatus("error");
          setError(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Network error");
      });
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="pixel-panel p-8 text-center max-w-sm w-full">
        {status === "checking" && (
          <>
            <p className="font-pixel text-[10px] text-shelley-amber tracking-wider mb-2 animate-pulse">
              VERIFYING MAGIC LINK...
            </p>
            <p className="text-white/30 text-sm">Hold tight</p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="font-pixel text-[10px] text-shelley-amber crt-glow tracking-wider mb-2">
              YOU&apos;RE IN &#10003;
            </p>
            <p className="text-white/40 text-sm">
              Redirecting to your profile...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="font-pixel text-[10px] text-red-400 tracking-wider mb-2">
              VERIFICATION FAILED
            </p>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <a href="/login" className="pixel-btn-ghost">
              BACK TO LOGIN
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-pixel text-[8px] text-white/30 tracking-wider animate-pulse">
            LOADING...
          </p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
