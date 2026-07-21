import MyPageClient from "./MyPageClient";

/**
 * Next.js App Router의 /my 진입 파일입니다.
 *
 * page.tsx에는 화면 전체 로직을 넣지 않고,
 * 실제 클라이언트 로직은 MyPageClient.tsx에 둡니다.
 */
export default function MyPage() {
  return <MyPageClient />;
}