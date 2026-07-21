import { supabase } from "@/lib/supabase";

import type {
  CameraRoom,
  UploadVerificationInput,
  UploadVerificationResult,
  VerificationRecord,
} from "./camera.types";

import {
  createVerificationFile,
  formatDateForPath,
} from "./camera.utils";

const STORAGE_BUCKET = "verification-videos";

type RoomRelation = {
  id: number;
  title: string;
  description: string | null;
};

type ProfileRelation = {
  display_name: string | null;
  avatar_url: string | null;
};

type RoomMemberRow = {
  room_id: number;
  rooms: RoomRelation | RoomRelation[] | null;
};

type MemberProfileRow = {
  room_id: number;
  user_id: string;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

type VerificationRow = {
  id: string;
  room_id: number;
  user_id: string;
  video_path: string;
  duration_seconds: number;
  status: "pending" | "approved" | "rejected";
  verification_date: string;
  created_at: string;
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

export async function getMyCameraRooms(): Promise<CameraRoom[]> {
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
    (membershipRows ?? []) as unknown as RoomMemberRow[];

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
      `방 멤버 정보를 불러오지 못했습니다: ${memberError.message}`
    );
  }

  const typedMemberRows =
    (memberRows ?? []) as unknown as MemberProfileRow[];

  return typedMembershipRows
    .map((membershipRow) => {
      const room = unwrapRelation(membershipRow.rooms);

      if (!room) {
        return null;
      }

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

        // DB에서는 title이지만 카메라 UI에서는 name으로 사용
        name: room.title,

        description: room.description,
        members,
      };
    })
    .filter((room): room is CameraRoom => room !== null);
}

export async function uploadVerification({
  roomId,
  blob,
  durationSeconds,
  onProgress,
}: UploadVerificationInput): Promise<UploadVerificationResult> {
  const user = await getCurrentUser();

  if (!roomId) {
    throw new Error("인증할 방이 선택되지 않았습니다.");
  }

  if (!blob || blob.size === 0) {
    throw new Error("업로드할 영상이 없습니다.");
  }

  onProgress?.(10);

  const verificationId = crypto.randomUUID();
  const file = createVerificationFile(blob);
  const datePath = formatDateForPath();
  const extension = file.name.split(".").pop() || "webm";

  const videoPath =
    `${user.id}/${roomId}/${datePath}/` +
    `${verificationId}.${extension}`;

  onProgress?.(25);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(videoPath, file, {
      contentType: file.type || "video/webm",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`영상 업로드에 실패했습니다: ${uploadError.message}`);
  }

  onProgress?.(75);

  const { data, error: insertError } = await supabase
    .from("verifications")
    .insert({
      id: verificationId,
      room_id: roomId,
      user_id: user.id,
      video_path: videoPath,
      duration_seconds: durationSeconds,
      status: "pending",
    })
    .select(`
      id,
      room_id,
      user_id,
      video_path,
      duration_seconds,
      status,
      verification_date,
      created_at
    `)
    .single();

  if (insertError) {
    // DB 저장 실패 시 이미 업로드된 영상도 제거
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([videoPath]);

    throw new Error(
      `인증 정보를 저장하지 못했습니다: ${insertError.message}`
    );
  }

  const verificationRow = data as VerificationRow;

  onProgress?.(100);

  const verification: VerificationRecord = {
    id: verificationRow.id,
    roomId: verificationRow.room_id,
    userId: verificationRow.user_id,
    videoPath: verificationRow.video_path,
    durationSeconds: verificationRow.duration_seconds,
    status: verificationRow.status,
    verificationDate: verificationRow.verification_date,
    createdAt: verificationRow.created_at,
  };

  return {
    verification,
  };
}

export async function createVerificationSignedUrl(
  videoPath: string,
  expiresInSeconds = 60 * 10
): Promise<string> {
  if (!videoPath) {
    throw new Error("영상 경로가 없습니다.");
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(videoPath, expiresInSeconds);

  if (error) {
    throw new Error(
      `영상 주소를 생성하지 못했습니다: ${error.message}`
    );
  }

  return data.signedUrl;
}