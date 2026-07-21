"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email") ?? "";

  const [loading, setLoading] = useState(false);

  async function resendEmail() {
    if (!email) return;

    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (error) {
      alert("메일 재전송에 실패했습니다.");
      return;
    }

    alert("인증 메일을 다시 보냈습니다.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">

          <div className="mb-5 text-6xl">
            📩
          </div>

          <h1 className="text-3xl font-black">
            인증 메일을 보냈어요!
          </h1>

          <p className="mt-4 text-neutral-500 leading-relaxed">
            아래 이메일로 인증 메일을 발송했습니다.
          </p>

          <p className="mt-3 font-semibold text-lg break-all">
            {email}
          </p>

          <p className="mt-5 text-sm text-neutral-500 leading-relaxed">
            메일 속 <b>인증하기</b> 버튼을 누르면
            <br />
            Hazzi로 자동 이동합니다.
          </p>

        </div>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-black font-semibold text-white transition hover:opacity-90"
        >
          Gmail 열기
        </a>

        <div className="my-8 border-t" />

        <p className="text-center text-sm text-neutral-500">
          메일이 오지 않았나요?
        </p>

        <button
          onClick={resendEmail}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-xl border border-neutral-300 font-medium transition hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "전송 중..." : "인증 메일 다시 보내기"}
        </button>

        <button
          onClick={() => router.replace("/signup")}
          className="mt-3 h-12 w-full rounded-xl font-medium text-[#FF00FF] transition hover:bg-[#FFF3FD]"
        >
          이메일 변경
        </button>

      </div>
    </main>
  );
}