import { supabase } from "@/lib/supabase";
import type {
  CreateRoomInput,
  MyRoom,
  Profile,
  RoomMembershipQueryRow,
} from "./types";

/**
 * 현재 로그인한 사용자를 가져옵니다.
 *
 * 로그인되어 있지 않으면 null을 반환합니다.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`사용자 조회 실패: ${error.message}`);
  }

  return user;
}

/**
 * 현재 사용자의 profiles 행을 조회합니다.
 */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        username,
        display_name,
        avatar_url,
        bio,
        onboarding_completed,
        created_at,
        updated_at
      `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`프로필 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 프로필 이미지를 Supabase Storage에 업로드합니다.
 *
 * profile-images 버킷이 먼저 생성되어 있어야 합니다.
 * 공개 URL을 사용하므로 버킷은 Public으로 설정합니다.
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

  /**
   * 같은 경로에 계속 덮어씁니다.
   * 사용자마다 하나의 프로필 이미지만 유지됩니다.
   */
  const filePath = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`프로필 사진 업로드 실패: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from("profile-images")
    .getPublicUrl(filePath);

  /**
   * 같은 URL을 계속 사용하면 브라우저 캐시 때문에
   * 이전 이미지가 보일 수 있어서 버전 값을 붙입니다.
   */
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * 현재 사용자의 프로필을 수정합니다.
 */
export async function updateMyProfile(
  userId: string,
  input: {
    displayName: string;
    bio: string;
    avatarUrl: string | null;
  }
): Promise<Profile> {
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("프로필 이름을 입력해주세요.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        display_name: displayName,
        bio: input.bio.trim() || null,
        avatar_url: input.avatarUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    )
    .select(
      `
        id,
        username,
        display_name,
        avatar_url,
        bio,
        onboarding_completed,
        created_at,
        updated_at
      `
    )
    .single();

  if (error) {
    throw new Error(`프로필 수정 실패: ${error.message}`);
  }

  return data as Profile;
}

/**
 * 현재 사용자가 참여 중인 방을 조회합니다.
 *
 * room_members를 기준으로 조회하는 이유:
 * - rooms.owner_id만 조회하면 내가 만든 방만 나옵니다.
 * - room_members를 기준으로 조회하면 내가 만든 방과 참여한 방이 모두 나옵니다.
 *
 * Supabase에서 아래 관계 조회가 작동하려면
 * room_members.room_id -> rooms.id 외래키가 연결되어 있어야 합니다.
 */
export async function getMyRooms(userId: string): Promise<MyRoom[]> {
  const { data, error } = await supabase
    .from("room_members")
    .select(
      `
        role,
        joined_at,
        rooms (
          id,
          title,
          description,
          cover_url,
          owner_id,
          verification_time,
          created_at
        )
      `
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    throw new Error(`방 목록 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RoomMembershipQueryRow[];

  return rows
    .filter((row) => row.rooms !== null)
    .map((row) => {
      const room = row.rooms!;

      return {
        id: room.id,
        title: room.title,
        description: room.description ?? "",
        coverUrl: room.cover_url ?? "/images/sample1.jpg",
        verificationTime: room.verification_time
          ? room.verification_time.slice(0, 5)
          : "시간 미정",
        role: row.role,
        streak: 0,
        todayStatus: "not-started",
      };
    });
}

/**
 * 방을 생성하고, 생성자를 room_members의 owner로 추가합니다.
 *
 * 중요:
 * rooms insert만 하면 방은 생성되지만,
 * room_members에 사용자가 없어서 My 페이지 목록에는 나타나지 않습니다.
 */
export async function createRoom(
  userId: string,
  input: CreateRoomInput
): Promise<number> {
  const { data: createdRoom, error: roomError } = await supabase
    .from("rooms")
    .insert({
      title: input.title.trim(),
      description: input.description.trim() || null,
      owner_id: userId,
      verification_time: input.verificationTime || null,
    })
    .select("id")
    .single();

  if (roomError || !createdRoom) {
    throw new Error(
      `방 생성 실패: ${roomError?.message ?? "생성된 방 정보가 없습니다."}`
    );
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: createdRoom.id,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    /**
     * room_members 추가에 실패하면 빈 방이 남을 수 있습니다.
     * 프로토타입 단계에서는 생성했던 방을 다시 삭제해 데이터 꼬임을 줄입니다.
     */
    await supabase.from("rooms").delete().eq("id", createdRoom.id);

    throw new Error(`방 멤버 등록 실패: ${memberError.message}`);
  }

  return createdRoom.id;
}

/**
 * 일반 멤버가 방에서 나갑니다.
 *
 * owner는 실수로 방을 버리지 않도록 여기서는 나갈 수 없게 처리합니다.
 * owner 방 삭제 기능은 별도 버튼으로 분리하는 편이 안전합니다.
 */
export async function leaveRoom(
  userId: string,
  roomId: number
): Promise<void> {
  const { data: membership, error: membershipError } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`방 참여 정보 조회 실패: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("이미 나간 방이거나 참여 정보가 없습니다.");
  }

  if (membership.role === "owner") {
    throw new Error("방장은 방에서 나갈 수 없습니다. 방 삭제 기능을 사용해주세요.");
  }

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`방 나가기 실패: ${error.message}`);
  }
}

/**
 * 방장이 방을 삭제합니다.
 *
 * room_members.room_id에 ON DELETE CASCADE가 설정되어 있다면
 * rooms만 삭제해도 관련 멤버 행이 함께 삭제됩니다.
 */
export async function deleteOwnedRoom(
  userId: string,
  roomId: number
): Promise<void> {
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId)
    .eq("owner_id", userId);

  if (error) {
    throw new Error(`방 삭제 실패: ${error.message}`);
  }
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }
}

/* 방 초대 코드를 만듭니다 */
function createInviteCode(length = 6): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * characters.length);
    return characters[index];
  }).join("");
}

export async function createRoomInvite(
  userId: string,
  roomId: number
): Promise<string> {
  /**
   * 먼저 활성화된 기존 코드가 있으면 재사용합니다.
   */
  const { data: existingInvite, error: existingError } = await supabase
    .from("room_invites")
    .select("code")
    .eq("room_id", roomId)
    .eq("created_by", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (existingError) {
    throw new Error(`초대 코드 조회 실패: ${existingError.message}`);
  }

  if (existingInvite?.code) {
    return existingInvite.code;
  }

  /**
   * 코드 충돌 가능성이 있으므로 최대 5번 재시도합니다.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createInviteCode();

    const { data, error } = await supabase
      .from("room_invites")
      .insert({
        room_id: roomId,
        code,
        created_by: userId,
        max_uses: 10,
        used_count: 0,
        is_active: true,
      })
      .select("code")
      .single();

    if (!error && data) {
      return data.code;
    }

    /**
     * PostgreSQL unique violation:
     * 우연히 같은 코드가 존재하면 새 코드로 다시 시도합니다.
     */
    if (error?.code !== "23505") {
      throw new Error(`초대 코드 생성 실패: ${error?.message}`);
    }
  }

  throw new Error("초대 코드를 만들지 못했습니다. 다시 시도해주세요.");
}

export async function joinRoomByInviteCode(
  inviteCode: string
): Promise<number> {
  const normalizedCode = inviteCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("초대 코드를 입력해주세요.");
  }

  const { data, error } = await supabase.rpc(
    "join_room_by_invite_code",
    {
      invite_code: normalizedCode,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "number") {
    throw new Error("입장한 방 정보를 확인하지 못했습니다.");
  }

  return data;
}