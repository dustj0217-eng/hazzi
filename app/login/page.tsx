"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /*
   * 이미 로그인된 사용자가 로그인 페이지에 들어오면
   * /my 페이지로 이동시킨다.
   */
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/my");
      }
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    setErrorMessage("");

    if (!normalizedEmail) {
      setErrorMessage("이메일을 입력해주세요.");
      return;
    }

    if (!password) {
      setErrorMessage("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error("로그인 오류:", {
          name: error.name,
          message: error.message,
          status: error.status,
          code: error.code,
        });

        switch (error.code) {
          case "invalid_credentials":
            setErrorMessage(
              "이메일 또는 비밀번호가 올바르지 않습니다."
            );
            break;

          case "email_not_confirmed":
            setErrorMessage(
              "아직 이메일 인증이 완료되지 않은 계정입니다."
            );
            break;

          case "email_provider_disabled":
            setErrorMessage(
              "현재 이메일 로그인이 비활성화되어 있습니다."
            );
            break;

          case "over_request_rate_limit":
          case "over_email_send_rate_limit":
            setErrorMessage(
              "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
            );
            break;

          default:
            setErrorMessage(
              `로그인에 실패했습니다. ${error.message}`
            );
        }

        return;
      }

      if (!data.user || !data.session) {
        setErrorMessage(
          "로그인 세션을 만들지 못했습니다. 다시 시도해주세요."
        );
        return;
      }

      router.replace("/my");
      router.refresh();
    } catch (error) {
      console.error("예상하지 못한 로그인 오류:", error);

      setErrorMessage(
        "예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafafa] px-5 py-10">
      <section className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-5xl font-black tracking-[-0.08em] text-[#ff00ff]"
          >
            HAZZI
          </Link>

          <h1 className="mt-8 text-2xl font-black tracking-[-0.04em] text-neutral-950">
            다시 만나서 반가워요
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            로그인하고 오늘의 인증을 시작해보세요.
          </p>
        </div>

        <div className="rounded-[32px] border border-neutral-200 bg-white p-6 
        shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-8">
          <form onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-neutral-800"
              >
                이메일
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                }}
                disabled={loading}
                className="h-14 w-full rounded-2xl border border-neutral-200 
                bg-neutral-50 px-4 text-[15px] text-neutral-950 outline-none transition 
                placeholder:text-neutral-400 focus:border-[#ff00ff] focus:bg-white focus:ring-4 
                focus:ring-[#ff00ff]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-neutral-800"
                >
                  비밀번호
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-neutral-400 transition hover:text-[#ff00ff]"
                  onClick={() => {
                    alert("비밀번호 찾기는 다음 단계에서 연결할게요.");
                  }}
                >
                  비밀번호를 잊었나요?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해주세요"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 pr-16 
                  text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 
                  focus:border-[#ff00ff] focus:bg-white focus:ring-4 focus:ring-[#ff00ff]/10 
                  disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 
                  transition hover:text-neutral-700"
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-14 w-full items-center justify-center 
              rounded-2xl bg-[#ff00ff] text-[15px] font-black text-white transition disabled:cursor-not-allowed 
              disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  로그인 중
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" />

            <span className="text-xs font-medium text-neutral-400">
              처음이신가요?
            </span>

            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <Link
            href="/signup"
            className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-[#ff00ff] bg-white 
            text-[15px] font-black text-[#ff00ff] transition hover:bg-[#ff00ff]/5"
          >
            회원가입하기
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-neutral-400">
          로그인하면 HAZZI의 이용약관 및 개인정보 처리방침에
          동의한 것으로 간주됩니다.
        </p>
      </section>
    </main>
  );
}