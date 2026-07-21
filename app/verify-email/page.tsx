import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
          <p className="text-neutral-500">
            불러오는 중...
          </p>
        </main>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}