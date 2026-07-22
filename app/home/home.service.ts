import { supabase } from "@/lib/supabase";

import type {
  FeedReviewer,
  HomeFeed,
  HomeRoom,
  ReviewDecision,
  SendNudgeInput,
  SendNudgeResult,
  SubmitReviewInput,
  SubmitReviewResult,
} from "./home.types";

const STORAGE_BUCKET = "verification-videos";
const SIGNED_URL_EXPIRES_IN = 60 * 60;

type RoomRelation = {
  id: number;
  title: string;
  description: string | null;
};

type ProfileRelation = {
  display_name: string | null;
  avatar_url: string | null;
};

type RoomMembershipRow = {
  room_id: number;
  rooms: RoomRelation | RoomRelation[] | null;
};

type RoomMemberRow = {
  room_id: number;
  user_id: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

type VerificationRow = {
  id: string;
  room_id: number;
  user_id: string;
  video_path: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  verification_date: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

type ReviewRow = {
  verification_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  reason: string | null;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/**
 * 브라우저의 현재 시간을 한국 날짜 YYYY-MM-DD 형태로 변환한다.
 *
 * 예:
 * 2026-07-22T15:10:00+09:00
 * → 2026-07-22
 */
export function getTodayInKorea(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(
      `사용자 정보를 불러오지 못했습니다: ${error.message}`
    );
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user;
}

export async function getMyHomeRooms(): Promise<HomeRoom[]> {
  const user = await getCurrentUser();

  const { data: membershipRows, error: membershipError } =
    await supabase
      .from("room_members")
      .select(`
        room_id,
        rooms (
          id,
          title,
          description
        )
      `)
      .eq("user_id", user.id);

  if (membershipError) {
    throw new Error(
      `참여 중인 방을 불러오지 못했습니다: ${membershipError.message}`
    );
  }

  const typedMembershipRows =
    (membershipRows ?? []) as unknown as RoomMembershipRow[];

  const roomIds = typedMembershipRows.map((row) => row.room_id);

  if (roomIds.length === 0) {
    return [];
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("room_members")
    .select(`
      room_id,
      user_id,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .in("room_id", roomIds);

  if (memberError) {
    throw new Error(
      `방 멤버를 불러오지 못했습니다: ${memberError.message}`
    );
  }

  const typedMemberRows =
    (memberRows ?? []) as unknown as RoomMemberRow[];

  return typedMembershipRows
    .map((membershipRow) => {
      const room = unwrapRelation(membershipRow.rooms);

      if (!room) return null;

      const members = typedMemberRows
        .filter((memberRow) => memberRow.room_id === room.id)
        .map((memberRow) => {
          const profile = unwrapRelation(memberRow.profiles);

          return {
            userId: memberRow.user_id,
            display_name:
              profile?.display_name?.trim() || "사용자",
            avatarUrl: profile?.avatar_url || null,
          };
        });

      return {
        id: room.id,
        name: room.title,
        description: room.description,
        members,
      };
    })
    .filter((room): room is HomeRoom => room !== null);
}

async function createSignedVideoUrls(videoPaths: string[]) {
  const uniquePaths = [...new Set(videoPaths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_EXPIRES_IN);

  if (error) {
    throw new Error(
      `영상 주소를 생성하지 못했습니다: ${error.message}`
    );
  }

  const urlMap = new Map<string, string>();

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      urlMap.set(item.path, item.signedUrl);
    }
  }

  return urlMap;
}

/**
 * 선택한 방에서 오늘 올라온 인증만 불러온다.
 *
 * 과거 인증은 DB에 그대로 남는다.
 * 날짜가 바뀌면 다른 verification_date가 조회되기 때문에
 * 홈에서는 자동으로 빈 슬롯처럼 보인다.
 */
export async function getRoomFeeds(
  roomId: number
): Promise<HomeFeed[]> {
  const user = await getCurrentUser();
  const today = getTodayInKorea();

  const {
    data: verificationRows,
    error: verificationError,
  } = await supabase
    .from("verifications")
    .select(`
      id,
      room_id,
      user_id,
      video_path,
      status,
      created_at,
      verification_date,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq("room_id", roomId)
    .eq("verification_date", today)
    .order("created_at", { ascending: false });

  if (verificationError) {
    throw new Error(
      `인증 피드를 불러오지 못했습니다: ${verificationError.message}`
    );
  }

  const typedVerificationRows =
    (verificationRows ?? []) as unknown as VerificationRow[];

  if (typedVerificationRows.length === 0) {
    return [];
  }

  /*
   * 기존 중복 데이터가 남아 있어도 사용자별 가장 최근 인증 하나만 사용한다.
   *
   * SQL 유니크 제약을 적용한 이후에는 원래 중복이 생기지 않는다.
   */
  const latestVerificationByUser = new Map<
    string,
    VerificationRow
  >();

  for (const verification of typedVerificationRows) {
    if (!latestVerificationByUser.has(verification.user_id)) {
      latestVerificationByUser.set(
        verification.user_id,
        verification
      );
    }
  }

  const uniqueVerificationRows = Array.from(
    latestVerificationByUser.values()
  );

  const verificationIds = uniqueVerificationRows.map(
    (row) => row.id
  );

  const { data: reviewRows, error: reviewError } = await supabase
    .from("verification_reviews")
    .select(`
      verification_id,
      reviewer_id,
      decision,
      reason,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .in("verification_id", verificationIds);

  if (reviewError) {
    throw new Error(
      `인정 정보를 불러오지 못했습니다: ${reviewError.message}`
    );
  }

  const typedReviewRows =
    (reviewRows ?? []) as unknown as ReviewRow[];

  const signedUrlMap = await createSignedVideoUrls(
    uniqueVerificationRows.map((row) => row.video_path)
  );

  return uniqueVerificationRows
    .map((verificationRow) => {
      const profile = unwrapRelation(
        verificationRow.profiles
      );

      const reviews = typedReviewRows.filter(
        (reviewRow) =>
          reviewRow.verification_id === verificationRow.id
      );

      const approvedBy: FeedReviewer[] = reviews
        .filter((review) => review.decision === "approved")
        .map((review) => {
          const reviewerProfile = unwrapRelation(
            review.profiles
          );

          return {
            userId: review.reviewer_id,
            display_name:
              reviewerProfile?.display_name?.trim() ||
              "사용자",
            avatarUrl:
              reviewerProfile?.avatar_url || null,
          };
        });

      const rejectedBy: FeedReviewer[] = reviews
        .filter((review) => review.decision === "rejected")
        .map((review) => {
          const reviewerProfile = unwrapRelation(
            review.profiles
          );

          return {
            userId: review.reviewer_id,
            display_name:
              reviewerProfile?.display_name?.trim() ||
              "사용자",
            avatarUrl:
              reviewerProfile?.avatar_url || null,
          };
        });

      const myReview = reviews.find(
        (review) => review.reviewer_id === user.id
      );

      const videoUrl = signedUrlMap.get(
        verificationRow.video_path
      );

      if (!videoUrl) {
        return null;
      }

      return {
        id: verificationRow.id,
        roomId: verificationRow.room_id,
        userId: verificationRow.user_id,

        display_name:
          profile?.display_name?.trim() || "사용자",
        profileUrl: profile?.avatar_url || null,

        videoPath: verificationRow.video_path,
        videoUrl,

        createdAt: verificationRow.created_at,
        verificationDate:
          verificationRow.verification_date,

        status: verificationRow.status,

        approvedBy,
        rejectedBy,

        myDecision: myReview?.decision ?? null,
        myReason: myReview?.reason ?? null,
      };
    })
    .filter((feed): feed is HomeFeed => feed !== null);
}

export async function submitVerificationReview({
  verificationId,
  decision,
  reason = null,
}: SubmitReviewInput): Promise<SubmitReviewResult> {
  const user = await getCurrentUser();

  const normalizedReason =
    decision === "rejected"
      ? reason?.trim() || null
      : null;

  const { error } = await supabase
    .from("verification_reviews")
    .upsert(
      {
        verification_id: verificationId,
        reviewer_id: user.id,
        decision,
        reason: normalizedReason,
      },
      {
        onConflict: "verification_id,reviewer_id",
      }
    );

  if (error) {
    throw new Error(
      `인정 결과를 저장하지 못했습니다: ${error.message}`
    );
  }

  return {
    decision,
    reason: normalizedReason,
  };
}

export async function removeVerificationReview(
  verificationId: string
): Promise<void> {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("verification_reviews")
    .delete()
    .eq("verification_id", verificationId)
    .eq("reviewer_id", user.id);

  if (error) {
    throw new Error(
      `인정 결과를 취소하지 못했습니다: ${error.message}`
    );
  }
}

/**
 * 호출 데이터를 DB에 기록한다.
 *
 * 현재 단계에서는 호출 기록만 저장한다.
 * 실제 푸시 알림을 전송하려면 추후 웹 푸시나
 * 모바일 푸시 시스템을 추가해야 한다.
 */
export async function sendMemberNudge({
  roomId,
  receiverId,
  message,
}: SendNudgeInput): Promise<SendNudgeResult> {
  const user = await getCurrentUser();
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    throw new Error("호출 문구를 선택해 주세요.");
  }

  if (normalizedMessage.length > 30) {
    throw new Error("호출 문구는 30자 이하로 작성해 주세요.");
  }

  if (user.id === receiverId) {
    throw new Error("자기 자신은 호출할 수 없습니다.");
  }

  /*
   * 같은 사람이 같은 상대에게 너무 자주 호출하는 것을 막는다.
   * 최근 10분 안의 호출이 있으면 새 호출을 저장하지 않는다.
   */
  const tenMinutesAgo = new Date(
    Date.now() - 10 * 60 * 1000
  ).toISOString();

  const { data: recentNudge, error: recentNudgeError } =
    await supabase
      .from("verification_nudges")
      .select("id")
      .eq("room_id", roomId)
      .eq("sender_id", user.id)
      .eq("receiver_id", receiverId)
      .gte("created_at", tenMinutesAgo)
      .limit(1)
      .maybeSingle();

  if (recentNudgeError) {
    throw new Error(
      `호출 상태를 확인하지 못했습니다: ${recentNudgeError.message}`
    );
  }

  if (recentNudge) {
    throw new Error(
      "조금 전에 호출했어요. 10분 뒤 다시 불러 주세요."
    );
  }

  const { data, error } = await supabase
    .from("verification_nudges")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: receiverId,
      message: normalizedMessage,
    })
    .select(`
      id,
      message,
      created_at
    `)
    .single();

  if (error) {
    throw new Error(
      `호출을 보내지 못했습니다: ${error.message}`
    );
  }

  return {
    id: data.id,
    message: data.message,
    createdAt: data.created_at,
  };
}