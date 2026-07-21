import { supabase } from "@/lib/supabase";

import type {
  FeedReviewer,
  HomeFeed,
  HomeRoom,
  ReviewDecision,
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

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`사용자 정보를 불러오지 못했습니다: ${error.message}`);
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user;
}

export async function getMyHomeRooms(): Promise<HomeRoom[]> {
  const user = await getCurrentUser();

  const { data: membershipRows, error: membershipError } = await supabase
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
            display_name: profile?.display_name?.trim() || "사용자",
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
    throw new Error(`영상 주소를 생성하지 못했습니다: ${error.message}`);
  }

  const urlMap = new Map<string, string>();

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      urlMap.set(item.path, item.signedUrl);
    }
  }

  return urlMap;
}

export async function getRoomFeeds(roomId: number): Promise<HomeFeed[]> {
  const user = await getCurrentUser();

  const { data: verificationRows, error: verificationError } = await supabase
    .from("verifications")
    .select(`
      id,
      room_id,
      user_id,
      video_path,
      status,
      created_at,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(30);

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

  const verificationIds = typedVerificationRows.map((row) => row.id);

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

  const typedReviewRows = (reviewRows ?? []) as unknown as ReviewRow[];
  const signedUrlMap = await createSignedVideoUrls(
    typedVerificationRows.map((row) => row.video_path)
  );

  return typedVerificationRows
    .map((verificationRow) => {
      const profile = unwrapRelation(verificationRow.profiles);
      const reviews = typedReviewRows.filter(
        (reviewRow) =>
          reviewRow.verification_id === verificationRow.id
      );

      const approvedBy: FeedReviewer[] = reviews
        .filter((review) => review.decision === "approved")
        .map((review) => {
          const reviewerProfile = unwrapRelation(review.profiles);

          return {
            userId: review.reviewer_id,
            display_name:
              reviewerProfile?.display_name?.trim() || "사용자",
            avatarUrl: reviewerProfile?.avatar_url || null,
          };
        });

      const rejectedBy: FeedReviewer[] = reviews
        .filter((review) => review.decision === "rejected")
        .map((review) => {
          const reviewerProfile = unwrapRelation(review.profiles);

          return {
            userId: review.reviewer_id,
            display_name:
              reviewerProfile?.display_name?.trim() || "사용자",
            avatarUrl: reviewerProfile?.avatar_url || null,
          };
        });

      const myReview = reviews.find(
        (review) => review.reviewer_id === user.id
      );

      const videoUrl = signedUrlMap.get(verificationRow.video_path);

      if (!videoUrl) {
        return null;
      }

      return {
        id: verificationRow.id,
        roomId: verificationRow.room_id,
        userId: verificationRow.user_id,
        display_name: profile?.display_name?.trim() || "사용자",
        profileUrl: profile?.avatar_url || null,
        videoPath: verificationRow.video_path,
        videoUrl,
        createdAt: verificationRow.created_at,
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
    decision === "rejected" ? reason?.trim() || null : null;

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
    throw new Error(`인정 결과를 저장하지 못했습니다: ${error.message}`);
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
    throw new Error(`인정 결과를 취소하지 못했습니다: ${error.message}`);
  }
}
