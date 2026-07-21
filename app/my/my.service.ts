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