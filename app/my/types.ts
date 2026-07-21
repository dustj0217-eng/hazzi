/**
 * My 페이지에서 사용하는 타입 모음입니다.
 *
 * DB에서 그대로 내려오는 타입과 화면에서 사용하는 타입을 섞지 않도록
 * 별도 파일로 분리했습니다.
 */

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type RoomRole = "owner" | "member";

/**
 * rooms 테이블의 컬럼 구조입니다.
 */
export type RoomRow = {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  verification_time: string | null;
  created_at: string;
};

/**
 * room_members와 rooms를 조인해서 받은 원본 형태입니다.
 *
 * Supabase 관계 조회 결과에서 rooms가 객체 또는 null로 들어올 수 있으므로
 * null 가능성을 명시했습니다.
 */
export type RoomMembershipQueryRow = {
  role: RoomRole;
  joined_at: string;
  rooms: RoomRow | null;
};

/**
 * 실제 My 화면에서 렌더링하기 편하도록 가공한 방 타입입니다.
 *
 * streak와 todayStatus는 아직 verifications 테이블이 없으므로
 * 임시 기본값을 사용합니다.
 */
export type MyRoom = {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  verificationTime: string;
  role: RoomRole;
  streak: number;
  todayStatus: "not-started" | "waiting" | "approved" | "retry";
};

export type CreateRoomInput = {
  title: string;
  description: string;
  verificationTime: string;
};