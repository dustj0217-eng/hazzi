"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();

    if (trimmedNickname.length < 2) {
      alert("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (trimmedNickname.length > 12) {
      alert("닉네임은 12자 이하로 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      alert("올바른 이메일을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      alert("약관에 동의해주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: trimmedNickname,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        alert("이미 가입된 이메일입니다.");
        return;
      }

      alert("회원가입에 실패했습니다.\n잠시 후 다시 시도해주세요.");
      return;
    }

    router.replace(
      `/verify-email?email=${encodeURIComponent(trimmedEmail)}`
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <div className="mb-8">

          <div className="mb-4 h-4 w-4 rounded-full bg-[#FF00FF]" />

          <h1 className="text-3xl font-black tracking-tight">
            회원가입
          </h1>

          <p className="mt-2 text-neutral-500">
            HAZZI와 함께 새로운 습관을 시작해보세요.
          </p>

        </div>

        <div className="space-y-4">

          <input
            placeholder="닉네임"
            value={nickname}
            onChange={(e)=>setNickname(e.target.value)}
            className="h-14 w-full rounded-2xl border border-neutral-200 px-4 focus:border-[#FF00FF] outline-none"
          />

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="h-14 w-full rounded-2xl border border-neutral-200 px-4 focus:border-[#FF00FF] outline-none"
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="h-14 w-full rounded-2xl border border-neutral-200 px-4 focus:border-[#FF00FF] outline-none"
          />

          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e)=>setConfirmPassword(e.target.value)}
            className="h-14 w-full rounded-2xl border border-neutral-200 px-4 focus:border-[#FF00FF] outline-none"
          />

        </div>

        <div className="mt-6 space-y-3 text-sm">

          <label className="flex items-center gap-2 cursor-pointer">

            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={()=>setAgreeTerms(!agreeTerms)}
            />

            서비스 이용약관에 동의합니다.

          </label>

          <label className="flex items-center gap-2 cursor-pointer">

            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={()=>setAgreePrivacy(!agreePrivacy)}
            />

            개인정보 처리방침에 동의합니다.

          </label>

        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="mt-8 h-14 w-full rounded-2xl bg-black text-white font-semibold transition hover:opacity-90"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        <div className="mt-8 text-center text-sm text-neutral-500">

          이미 계정이 있으신가요?

          <Link
            href="/login"
            className="ml-2 font-semibold text-[#FF00FF]"
          >
            로그인
          </Link>

        </div>

      </div>

    </main>
  );
}