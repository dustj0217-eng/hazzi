"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRoom,
  deleteOwnedRoom,
  getCurrentUser,
  getMyProfile,
  getMyRooms,
  leaveRoom,
  logout,
  updateMyProfile,
  uploadProfileImage,
  createRoomInvite,
  joinRoomByInviteCode,
} from "./my.service";
import type { MyRoom, Profile } from "./types";
import BottomNav from "@/components/nav";

const TODAY = new Date();

/**
 * 이번 단계에서는 캘린더 UI만 남겨둡니다.
 *
 * 실제 인증 기록은 아직 verifications 테이블이 없으므로 연결하지 않습니다.
 * verifications를 만든 뒤 이 배열 대신 월별 인증 데이터를 조회하면 됩니다.
 */
function buildCalendarDays(year: number, monthIndex: number) {
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();

  // 화면은 월요일 시작이므로 일요일(0)을 마지막 칸(6)으로 바꿉니다.
  const mondayBasedBlankCount = firstWeekday === 0 ? 6 : firstWeekday - 1;

  return {
    blankCount: mondayBasedBlankCount,
    days: Array.from({ length: lastDate }, (_, index) => index + 1),
  };
}

export default function MyPageClient() {
  const router = useRouter();

  // 로그인 사용자 ID와 이메일
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Supabase에서 불러오는 데이터
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<MyRoom[]>([]);

  // 화면 상태
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<MyRoom | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  // 프로필 편집 상태
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // 방 생성 입력값
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomTime, setNewRoomTime] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // 초대 코드 관련
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);

  /**
   * 프로필과 방 목록을 한 번에 다시 불러옵니다.
   *
   * useCallback을 사용해 함수 참조가 렌더링마다 바뀌지 않게 했습니다.
   */
  const loadMyPage = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const [profileData, roomData] = await Promise.all([
        getMyProfile(user.id),
        getMyRooms(user.id),
      ]);

      setProfile(profileData);
      setRooms(roomData);
    } catch (error) {
      console.error(error);
      setPageError(
        error instanceof Error
          ? error.message
          : "My 페이지 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMyPage();
  }, [loadMyPage]);

  const displayName =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    userEmail.split("@")[0] ||
    "사용자";

  const avatarUrl = profile?.avatar_url?.trim() ?? "";

  const calendar = useMemo(
    () => buildCalendarDays(TODAY.getFullYear(), TODAY.getMonth()),
    []
  );

  /* 방 추가 */
  async function handleCreateRoom() {
    if (!userId || !newRoomTitle.trim() || creatingRoom) {
      return;
    }

    setCreatingRoom(true);

    try {
      await createRoom(userId, {
        title: newRoomTitle,
        description: newRoomDescription,
        verificationTime: newRoomTime,
      });

      // 입력값 초기화
      setNewRoomTitle("");
      setNewRoomDescription("");
      setNewRoomTime("");
      setCreateRoomOpen(false);

      // 생성된 방을 화면에 반영
      await loadMyPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "방 생성에 실패했습니다.");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleLeaveOrDeleteRoom(room: MyRoom) {
    if (!userId) {
      return;
    }

    const actionText = room.role === "owner" ? "삭제" : "나가기";
    const confirmed = window.confirm(
      room.role === "owner"
        ? `"${room.title}" 방을 삭제할까요?\n방의 모든 참여 정보도 함께 삭제됩니다.`
        : `"${room.title}" 방에서 나갈까요?`
    );

    if (!confirmed) {
      return;
    }

    try {
      if (room.role === "owner") {
        await deleteOwnedRoom(userId, room.id);
      } else {
        await leaveRoom(userId, room.id);
      }

      setSelectedRoom(null);
      await loadMyPage();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : `방 ${actionText}에 실패했습니다.`
      );
    }
  }

  /* 프로필 편집 */
  function openProfileEdit() {
    setEditDisplayName(
      profile?.display_name?.trim() ||
        profile?.username?.trim() ||
        userEmail.split("@")[0] ||
        ""
    );

    setEditBio(profile?.bio ?? "");
    setEditAvatarFile(null);
    setEditAvatarPreview(profile?.avatar_url ?? "");

    setSettingsOpen(false);
    setProfileEditOpen(true);
  }

  function handleProfileImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택할 수 있습니다.");
      event.target.value = "";
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      alert("프로필 사진은 5MB 이하만 사용할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setEditAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);
    setEditAvatarPreview(previewUrl);
  }

  async function handleSaveProfile() {
    if (!userId || savingProfile) {
      return;
    }

    if (!editDisplayName.trim()) {
      alert("프로필 이름을 입력해주세요.");
      return;
    }

    setSavingProfile(true);

    try {
      let nextAvatarUrl = profile?.avatar_url ?? null;

      if (editAvatarFile) {
        nextAvatarUrl = await uploadProfileImage(userId, editAvatarFile);
      }

      const updatedProfile = await updateMyProfile(userId, {
        displayName: editDisplayName,
        bio: editBio,
        avatarUrl: nextAvatarUrl,
      });

      setProfile(updatedProfile);
      setProfileEditOpen(false);
      setEditAvatarFile(null);

      alert("프로필이 수정되었습니다.");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "프로필 수정에 실패했습니다."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  /* 초대 코드 */
  async function handleCreateInvite(room: MyRoom) {
    if (!userId || creatingInvite) {
      return;
    }

    setCreatingInvite(true);

    try {
      const code = await createRoomInvite(userId, room.id);

      setInviteCode(code);
      setSelectedRoom(null);
      setInviteOpen(true);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "초대 코드를 만들지 못했습니다."
      );
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleCopyInviteCode() {
    if (!inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      alert("초대 코드를 복사했습니다.");
    } catch {
      alert(`초대 코드: ${inviteCode}`);
    }
  }

  async function handleJoinRoom() {
    if (!joinCode.trim() || joiningRoom) {
      return;
    }

    setJoiningRoom(true);

    try {
      await joinRoomByInviteCode(joinCode);

      setJoinCode("");
      setJoinRoomOpen(false);

      await loadMyPage();

      alert("방에 참여했습니다.");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "방에 참여하지 못했습니다."
      );
    } finally {
      setJoiningRoom(false);
    }
  }

  /* 로그아웃 */
  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    }
  }

  return (
    <main className="min-h-screen bg-white pb-32 text-[#111111]">
      {/* 배경 격자 */}
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(rgba(73,109,142,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(73,109,142,0.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* 상단 프로필 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-4 pt-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400">
              MY
            </p>

            <div className="mt-1 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName} 프로필`}
                  className="h-11 w-11 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff00ff] text-base font-black text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-3xl font-bold tracking-[-0.07em]">
                  {loading ? "불러오는 중..." : displayName}
                </h1>
                <p className="mt-1 text-xs text-neutral-400">
                  {profile?.username
                    ? `@${profile.username}`
                    : userEmail || "로그인된 사용자"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label="설정 열기"
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4">
        {pageError && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
            <p>{pageError}</p>
            <button
              type="button"
              onClick={loadMyPage}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {/* 캘린더: 현재는 날짜 UI만 표시 */}
        <section className="overflow-hidden rounded-[30px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400">
                MONTHLY LOG
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.05em]">
                {TODAY.getFullYear()}년 {TODAY.getMonth() + 1}월
              </h2>
            </div>

            <p className="text-right text-xs leading-5 text-neutral-400">
              인증 기록 연동은
              <br />
              다음 단계에서 추가
            </p>
          </div>

          <div className="mt-6 grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-300">
            {["월", "화", "수", "목", "금", "토", "일"].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-2">
            {Array.from({ length: calendar.blankCount }).map((_, index) => (
              <div key={`blank-${index}`} className="aspect-square" />
            ))}

            {calendar.days.map((day) => {
              const isToday = day === TODAY.getDate();

              return (
                <div
                  key={day}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold ${
                    isToday
                      ? "bg-black text-white"
                      : "text-neutral-700"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </section>

        {/* 내 방 제목 */}
        <section className="mb-3 mt-7 flex items-end justify-between px-1">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
              MY ROOMS
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.05em]">
              오늘의 습관
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJoinRoomOpen(true)}
              className="h-10 rounded-full bg-neutral-100 px-4 text-sm font-semibold text-black"
            >
              코드 입력
            </button>

            <button
              type="button"
              onClick={() => setCreateRoomOpen(true)}
              className="h-10 rounded-full bg-black px-4 text-sm font-semibold text-white"
            >
              새 방 +
            </button>
          </div>
        </section>

        {/* 방 목록 */}
        <section className="space-y-3">
          {loading && (
            <div className="rounded-[28px] bg-white p-6 text-center text-sm font-medium text-neutral-400 shadow-sm">
              방 목록을 불러오는 중...
            </div>
          )}

          {!loading && rooms.length === 0 && !pageError && (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
              <p className="font-bold">아직 참여한 방이 없어요.</p>
              <p className="mt-1 text-sm text-neutral-400">
                새 방 버튼을 눌러 첫 습관방을 만들어보세요.
              </p>
            </div>
          )}

          {rooms.map((room) => (
            <button
              type="button"
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className="relative block w-full overflow-hidden rounded-[28px] bg-neutral-300 text-left"
            >
              <div className="relative aspect-[16/5]">
                <img
                  src={room.coverUrl}
                  alt={room.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-black/30" />

                <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{room.title}</p>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold backdrop-blur">
                        {room.role === "owner" ? "방장" : "멤버"}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-xs text-white/65">
                      {room.description || "방 소개가 아직 없어요."}
                    </p>
                  </div>

                  <p className="text-xs font-medium text-white/70">
                    인증 시간 {room.verificationTime}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>

      {/* 하단 내비게이션 */}
      <BottomNav />

      {/* 방 상세 바텀시트 */}
      {selectedRoom && (
        <>
          <button
            type="button"
            onClick={() => setSelectedRoom(null)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="방 상세 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                ROOM
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-[-0.06em]">
                {selectedRoom.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {selectedRoom.description || "방 소개가 아직 없어요."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#f4f4f4] p-4">
                  <p className="text-xs text-neutral-400">내 역할</p>
                  <p className="mt-2 font-bold">
                    {selectedRoom.role === "owner" ? "방장" : "멤버"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f4f4f4] p-4">
                  <p className="text-xs text-neutral-400">인증 시간</p>
                  <p className="mt-2 font-bold">
                    {selectedRoom.verificationTime}
                  </p>
                </div>
              </div>

              {selectedRoom.role === "owner" && (
                <button
                  type="button"
                  onClick={() => handleCreateInvite(selectedRoom)}
                  disabled={creatingInvite}
                  className="mt-7 h-14 w-full rounded-2xl bg-[#ff00ff] text-sm font-bold text-white disabled:opacity-40"
                >
                  {creatingInvite ? "코드 만드는 중..." : "친구 초대하기"}
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push(`/camera?roomId=${selectedRoom.id}`)}
                className={`h-14 w-full rounded-2xl bg-black text-sm font-bold text-white ${
                  selectedRoom.role === "owner" ? "mt-2" : "mt-7"
                }`}
              >
                이 방에서 인증하기
              </button>

              <button
                type="button"
                onClick={() => handleLeaveOrDeleteRoom(selectedRoom)}
                className="mt-2 h-12 w-full text-sm font-semibold text-red-500"
              >
                {selectedRoom.role === "owner" ? "방 삭제하기" : "방 나가기"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* 설정 바텀시트 */}
      {settingsOpen && (
        <>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="설정 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mt-5 rounded-3xl bg-[#f4f4f4] p-4">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${displayName} 프로필`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff00ff] font-black text-white">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-bold">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-neutral-400">
                      {userEmail}
                    </p>
                  </div>
                </div>

                {profile?.bio && (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    {profile.bio}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={openProfileEdit}
                className="mt-4 h-14 w-full rounded-2xl bg-[#f4f4f4] text-sm font-bold text-black"
              >
                프로필 편집
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
              >
                로그아웃
              </button>
            </div>
          </section>
        </>
      )}

      {/* 프로필 편집 바텀시트 */}
      {profileEditOpen && (
        <>
          <button
            type="button"
            onClick={() => {
              if (!savingProfile) {
                setProfileEditOpen(false);
              }
            }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="프로필 편집 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    PROFILE
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">프로필 편집</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileEditOpen(false)}
                  disabled={savingProfile}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-lg disabled:opacity-40"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>

              <div className="mt-7 flex flex-col items-center">
                <label className="relative cursor-pointer">
                  {editAvatarPreview ? (
                    <img
                      src={editAvatarPreview}
                      alt="프로필 미리보기"
                      className="h-24 w-24 rounded-full border border-neutral-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#ff00ff] text-3xl font-black text-white">
                      {(editDisplayName.trim().slice(0, 1) || "?").toUpperCase()}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-black text-xs font-bold text-white">
                    +
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-xs text-neutral-400">
                  사진을 눌러 변경
                </p>
              </div>

              <div className="mt-7 space-y-4">
                <div>
                  <label
                    htmlFor="profile-display-name"
                    className="mb-2 block text-xs font-semibold text-neutral-500"
                  >
                    이름
                  </label>

                  <input
                    id="profile-display-name"
                    value={editDisplayName}
                    onChange={(event) =>
                      setEditDisplayName(event.target.value)
                    }
                    placeholder="프로필 이름"
                    maxLength={20}
                    className="h-14 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-bio"
                    className="mb-2 block text-xs font-semibold text-neutral-500"
                  >
                    소개
                  </label>

                  <textarea
                    id="profile-bio"
                    value={editBio}
                    onChange={(event) => setEditBio(event.target.value)}
                    placeholder="나를 짧게 소개해주세요"
                    maxLength={100}
                    className="min-h-[96px] w-full resize-none rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-black"
                  />

                  <p className="mt-2 text-right text-xs text-neutral-300">
                    {editBio.length}/100
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!editDisplayName.trim() || savingProfile}
                className="mt-6 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingProfile ? "저장하는 중..." : "저장하기"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* 새 방 생성 바텀시트 */}
      {createRoomOpen && (
        <>
          <button
            type="button"
            onClick={() => setCreateRoomOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-label="새 방 만들기 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[36px] bg-white px-6 pb-8 pt-4 shadow-2xl">
              <div className="mx-auto mb-7 h-1.5 w-12 rounded-full bg-neutral-200" />

              <h2 className="text-2xl font-black tracking-tight">
                새 방 만들기
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                함께 인증할 새로운 습관방을 만들어보세요.
              </p>

              <div className="mt-7 space-y-4">
                <input
                  value={newRoomTitle}
                  onChange={(event) => setNewRoomTitle(event.target.value)}
                  placeholder="방 이름"
                  maxLength={20}
                  className="h-14 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
                />

                <textarea
                  value={newRoomDescription}
                  onChange={(event) =>
                    setNewRoomDescription(event.target.value)
                  }
                  placeholder="방을 한 줄로 소개해주세요"
                  maxLength={100}
                  className="min-h-[100px] w-full resize-none rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-black"
                />

                <div>
                  <label
                    htmlFor="verification-time"
                    className="mb-2 block text-xs font-semibold text-neutral-500"
                  >
                    인증 시간
                  </label>

                  <input
                    id="verification-time"
                    type="time"
                    value={newRoomTime}
                    onChange={(event) => setNewRoomTime(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={!newRoomTitle.trim() || creatingRoom}
                className="mt-6 h-14 w-full rounded-2xl bg-black font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creatingRoom ? "만드는 중..." : "만들기"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* 친구 초대 코드 바텀시트 */}
      {inviteOpen && (
        <>
          <button
            type="button"
            onClick={() => setInviteOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="초대 코드 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                INVITE
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                친구에게 코드를 보내세요
              </h2>

              <div className="mt-7 rounded-[28px] bg-neutral-100 px-5 py-8 text-center">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-400">
                  INVITE CODE
                </p>

                <p className="mt-3 text-4xl font-black tracking-[0.2em]">
                  {inviteCode}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="mt-4 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
              >
                코드 복사하기
              </button>
            </div>
          </section>
        </>
      )}

      {/* 친구 초대 코드 입력 바텀시트 */}
      {joinRoomOpen && (
        <>
          <button
            type="button"
            onClick={() => setJoinRoomOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="초대 코드 입력 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                JOIN ROOM
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                초대 코드 입력
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                친구에게 받은 6자리 코드를 입력해주세요.
              </p>

              <input
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="A7K9PX"
                maxLength={6}
                autoCapitalize="characters"
                className="mt-7 h-16 w-full rounded-2xl border border-neutral-200 px-4 text-center text-2xl font-black tracking-[0.22em] uppercase outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={joinCode.length !== 6 || joiningRoom}
                className="mt-4 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {joiningRoom ? "입장하는 중..." : "방 들어가기"}
              </button>
            </div>
          </section>
        </>
      )}      
    </main>
  );
}