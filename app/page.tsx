"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // 이메일 인증 링크를 통해 들어온 경우
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("이메일 인증 실패:", error);
            router.replace(
              `/login?error=${encodeURIComponent(error.message)}`
            );
            return;
          }

          // 인증 및 로그인 성공
          router.replace("/home");
          return;
        }

        // 일반적으로 앱에 접속한 경우
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("세션 확인 실패:", error);
          router.replace("/login");
          return;
        }

        if (session) {
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      } catch (error) {
        console.error("인증 처리 중 오류:", error);
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-neutral-500">HAZZI 불러오는 중...</p>
    </main>
  );
}