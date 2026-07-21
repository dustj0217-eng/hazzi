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
} from "./my.service";
import type { MyRoom, Profile } from "./types";

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

  // 방 생성 입력값
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomTime, setNewRoomTime] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

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

          <button
            type="button"
            onClick={() => setCreateRoomOpen(true)}
            className="h-10 rounded-full bg-black px-4 text-sm font-semibold text-white"
          >
            새 방 +
          </button>
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
      <nav className="fixed bottom-4 left-0 right-0 z-30">
        <div className="mx-auto flex max-w-[280px] items-center justify-between rounded-full bg-[#ff00ff] px-3 py-3 shadow-2xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-11 min-w-20 items-center justify-center rounded-full px-5 text-xs font-bold text-white/50"
          >
            HOME
          </button>

          <button
            type="button"
            onClick={() => router.push("/camera")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white"
            aria-label="카메라"
          >
            <span className="h-4 w-4 rounded-full border-[3px] border-[#ff00ff]" />
          </button>

          <button
            type="button"
            className="flex h-11 min-w-20 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-black"
          >
            MY
          </button>
        </div>
      </nav>

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

              <button
                type="button"
                onClick={() => router.push(`/camera?roomId=${selectedRoom.id}`)}
                className="mt-7 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
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
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <h2 className="text-2xl font-bold">설정</h2>

              <div className="mt-5 rounded-3xl bg-[#f4f4f4] p-4">
                <p className="font-bold">{displayName}</p>
                <p className="mt-1 text-xs text-neutral-400">{userEmail}</p>

                {profile?.bio && (
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    {profile.bio}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
              >
                로그아웃
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
    </main>
  );
}