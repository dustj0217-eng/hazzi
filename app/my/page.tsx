"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RoomStatus =
  | "approved"
  | "waiting"
  | "not-started"
  | "retry";

type Room = {
  id: number;
  name: string;
  streak: number;
  status: RoomStatus;
  cover: string;
  members: string[];
  approved: string[];
  time: string;
};

type CalendarStatus = "complete" | "partial" | "missed" | "future";

type CalendarDay = {
  day: number;
  status: CalendarStatus;
  completed: number;
  total: number;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

const calendarDays: CalendarDay[] = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;

  const records: Record<number, Omit<CalendarDay, "day">> = {
    1: { status: "complete", completed: 3, total: 3 },
    2: { status: "complete", completed: 3, total: 3 },
    3: { status: "partial", completed: 2, total: 3 },
    4: { status: "complete", completed: 3, total: 3 },
    5: { status: "missed", completed: 0, total: 3 },
    6: { status: "complete", completed: 3, total: 3 },
    7: { status: "complete", completed: 3, total: 3 },
    8: { status: "complete", completed: 4, total: 4 },
    9: { status: "partial", completed: 3, total: 4 },
    10: { status: "complete", completed: 4, total: 4 },
    11: { status: "complete", completed: 4, total: 4 },
    12: { status: "complete", completed: 4, total: 4 },
    13: { status: "missed", completed: 1, total: 4 },
    14: { status: "complete", completed: 4, total: 4 },
    15: { status: "complete", completed: 4, total: 4 },
    16: { status: "partial", completed: 3, total: 4 },
    17: { status: "complete", completed: 4, total: 4 },
    18: { status: "partial", completed: 2, total: 4 },
  };

  const record = records[day];

  return record ? { day, ...record, } : {
      day,
      status: "future",
      completed: 0,
      total: 4,
    }
});

const calendarStatusLabel: Record<CalendarStatus, string> = {
  complete: "전부 인증",
  partial: "일부 인증",
  missed: "인증 부족",
  future: "예정",
};

const discoverRooms = [
  {
    id: 101,
    name: "매일 독서",
    members: 148,
    category: "독서",
    profiles: [
      "/images/profile2.jpg",
      "/images/profile3.jpg",
      "/images/profile5.jpg",
    ],
  },
  {
    id: 102,
    name: "퇴근 후 러닝",
    members: 84,
    category: "운동",
    profiles: [
      "/images/profile1.jpg",
      "/images/profile4.jpg",
      "/images/profile6.jpg",
    ],
  },
  {
    id: 103,
    name: "하루 한 문제",
    members: 231,
    category: "공부",
    profiles: [
      "/images/profile3.jpg",
      "/images/profile5.jpg",
      "/images/profile2.jpg",
    ],
  },
];

const statusLabel: Record<RoomStatus, string> = {
  approved: "인정 완료",
  waiting: "인정 대기",
  "not-started": "아직 인증 전",
  retry: "다시 인증 필요",
};

export default function MyPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [joinedRoomIds, setJoinedRoomIds] = useState<number[]>([]);

  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomTime, setNewRoomTime] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPageData() {
      setProfileLoading(true);
      setRoomsLoading(true);
      setProfileError("");
      setRoomsError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "");

      const [profileResult, roomsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url, bio, onboarding_completed, created_at, updated_at"
          )
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("rooms")
          .select(
            "id, title, description, cover_url, owner_id, verification_time, created_at, room_members!inner(user_id, role)"
          )
          .eq("room_members.user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (profileResult.error) {
        console.error("프로필 조회 오류:", profileResult.error);
        setProfileError("프로필 정보를 불러오지 못했습니다.");
      } else {
        setProfile(profileResult.data);
      }

      if (roomsResult.error) {
        console.error("방 목록 조회 오류:", roomsResult.error);
        setRoomsError("방 목록을 불러오지 못했습니다.");
      } else {
        const mappedRooms: Room[] = (roomsResult.data ?? []).map((room) => ({
          id: room.id,
          name: room.title,
          streak: 1,
          status: "not-started",
          cover: room.cover_url || "/images/sample1.jpg",
          members: [],
          approved: [],
          time: room.verification_time || "인증 시간 미정",
        }));

        setRooms(mappedRooms);
      }

      setProfileLoading(false);
      setRoomsLoading(false);
    }

    loadPageData();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("로그아웃에 실패했습니다.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  async function handleCreateRoom() {
    if (!newRoomTitle.trim()) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();


    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }


    const { error } = await supabase
      .from("rooms")
      .insert({
        title: newRoomTitle,
        description: newRoomDescription,
        owner_id: user.id,
      });


    if (error) {
      console.error(error);
      alert("방 만들기에 실패했습니다.");
      return;
    }


    setCreateRoomOpen(false);

    setNewRoomTitle("");
    setNewRoomDescription("");
  }

  const displayName =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    userEmail.split("@")[0] ||
    "사용자";

  const avatarUrl = profile?.avatar_url?.trim() || "";

  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(
    calendarDays.find((date) => date.day === 18) ?? null
  );


  const activeDays = calendarDays.filter(
    (date) => date.day <= 18 && date.status !== "missed"
  ).length;

  const leaveRoom = (roomId: number) => {
    setRooms((current) => current.filter((room) => room.id !== roomId));
    setSelectedRoom(null);
  };

  const toggleJoin = (roomId: number) => {
    setJoinedRoomIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId]
    );
  };

  return (
    <main className="min-h-screen pb-32 text-[#111111]">
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "linear-gradient(rgba(73, 109, 142, 0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(73, 109, 142, 0.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Header */}

      <header className="sticky top-0 z-30 bg-[#ffffff]/80 backdrop-blur-xl">
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
                  {profileLoading ? "불러오는 중..." : displayName}
                </h1>

                {profileError ? (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {profileError}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-400">
                    {profile?.username
                      ? `@${profile.username}`
                      : userEmail || "로그인된 사용자"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white"
            aria-label="설정"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.2h-4V21a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H2.8v-4H3a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 001.9.3A1.7 1.7 0 0010 3V2.8h4V3a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9A1.7 1.7 0 0021 10h.2v4H21a1.7 1.7 0 00-1.6 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4">
        {/* Monthly Calendar */}

        <section className="overflow-hidden rounded-[30px] bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400">
                MONTHLY LOG
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.05em]">
                2026년 7월
              </h2>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-semibold text-neutral-400">
                인증한 날
              </p>
              <p className="mt-1 text-xl font-bold tracking-[-0.04em]">
                {activeDays}<span className="text-sm text-neutral-300"> / 18</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 text-center text-[11px] font-semibold text-neutral-300">
            {["월", "화", "수", "목", "금", "토", "일"].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`blank-${index}`} className="aspect-square" />
            ))}

            {calendarDays.map((date) => {
              const isToday = date.day === 18;
              const isSelected = selectedDate?.day === date.day;

              const statusImage = {
                complete: "/images/perfect.png",
                partial: "/images/half.png",
              };

            return (
              <button
                key={date.day}
                onClick={() => setSelectedDate(date)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl transition-all duration-200 ${
                isSelected
                    ? "bg-black text-white"
                    : isToday
                    ? "bg-neutral-200 text-black"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                aria-label={`7월 ${date.day}일 ${calendarStatusLabel[date.status]}`}
            >
                {/* 상태 이미지 */}
                {date.status !== "future" && date.status !== "missed" && (
                    <img
                        src={statusImage[date.status]}
                        alt={date.status}
                        className={`absolute top-2 right-2 h-12 w-12`}
                    />
                )}

                {/* 날짜 */}
                <span className="text-sm font-semibold">
                {date.day}
                </span>
              </button>
            );
            })}
          </div>
        </section>

        {/* Room Heading */}

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
            onClick={() => setCreateRoomOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold"
          >
            <span>새 방</span>

            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </section>

        {/* Rooms */}

        <section className="space-y-3">
          {roomsLoading && (
            <div className="rounded-[28px] bg-white p-6 text-center text-sm font-medium text-neutral-400">
              방 목록을 불러오는 중...
            </div>
          )}

          {!roomsLoading && roomsError && (
            <div className="rounded-[28px] bg-white p-6 text-center text-sm font-medium text-red-500">
              {roomsError}
            </div>
          )}

          {!roomsLoading && !roomsError && rooms.length === 0 && (
            <div className="rounded-[28px] bg-white p-6 text-center">
              <p className="font-bold">아직 참여한 방이 없어요.</p>
              <p className="mt-1 text-sm text-neutral-400">
                위의 새 방 버튼을 눌러 첫 습관방을 만들어보세요.
              </p>
            </div>
          )}

          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className="relative block w-full overflow-hidden rounded-[28px] bg-neutral-300 text-left"
            >
              <div className="relative aspect-[16/5]">
                <img
                  src={room.cover}
                  alt={room.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-black/30" />

                <div className="absolute inset-y-0 left-0 flex flex-col justify-between p-4 text-white">
                  <div>
                    <p className="text-lg font-bold">{room.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-white/55">
                      {room.streak}일째
                    </p>
                  </div>

                  {room.approved.length > 0 ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {room.approved.slice(0, 4).map((profile, index) => (
                          <img
                            key={index}
                            src={profile}
                            alt=""
                            className="h-8 w-8 rounded-full border-2 border-white/80 object-cover"
                          />
                        ))}
                      </div>

                      <span className="ml-2 text-[11px] font-medium text-white/75">
                        인정
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-white/55">
                      아직 인정한 사람이 없어요
                    </span>
                  )}
                </div>

                <div className="absolute right-3 top-3">
                  <span
                    className={`block rounded-full px-3 py-2 text-[11px] font-semibold backdrop-blur-xl ${
                      room.status === "approved"
                        ? "bg-white text-black"
                        : room.status === "waiting"
                        ? "bg-black/35 text-white"
                        : room.status === "retry"
                        ? "bg-white text-black"
                        : "bg-black/25 text-white/75"
                    }`}
                  >
                    {statusLabel[room.status]}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-lg">
                  {room.status === "approved" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                    >
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  )}

                  {room.status === "waiting" && (
                    <span className="h-3 w-3 rounded-full border-2 border-white" />
                  )}

                  {room.status === "not-started" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  )}

                  {room.status === "retry" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4v6h6" />
                      <path d="M20 20v-6h-6" />
                      <path d="M5.5 15a7 7 0 0011.8 2.5L20 14" />
                      <path d="M18.5 9A7 7 0 006.7 6.5L4 10" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>

      {/* Bottom Navigation */}

      <nav className="fixed bottom-4 left-0 right-0 z-30">
        <div className="mx-auto flex max-w-[280px] items-center justify-between rounded-full bg-[#ff00ff] px-3 py-3 shadow-2xl">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex h-11 min-w-20 items-center justify-center rounded-full px-5 text-xs font-bold text-white/45"
          >
            HOME
          </button>

          <button
            onClick={() => {
              window.location.href = "/camera";
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black"
          >
            <span className="h-4 w-4 rounded-full border-[3px] border-[#ff00ff]" />
          </button>

          <button className="flex h-11 min-w-20 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-black">
            MY
          </button>
        </div>
      </nav>

      {/* Room Detail Sheet */}

      {selectedRoom && (
        <>
          <button
            onClick={() => setSelectedRoom(null)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="방 상세 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    ROOM
                  </p>

                  <h2 className="mt-1 text-3xl font-bold tracking-[-0.06em]">
                    {selectedRoom.name}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-400">
                    {selectedRoom.streak}일째 이어가는 중
                  </p>
                </div>

                <div className="flex -space-x-2">
                  {selectedRoom.members.slice(0, 4).map((member, index) => (
                    <img
                      key={index}
                      src={member}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#f4f4f4] p-4">
                  <p className="text-xs font-medium text-neutral-400">
                    오늘 상태
                  </p>

                  <p className="mt-2 font-bold">
                    {statusLabel[selectedRoom.status]}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f4f4f4] p-4">
                  <p className="text-xs font-medium text-neutral-400">
                    인증 시간
                  </p>

                  <p className="mt-2 font-bold">{selectedRoom.time}</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold">방 멤버</p>

                <div className="flex items-center gap-2">
                  {selectedRoom.members.map((member, index) => (
                    <img
                      key={index}
                      src={member}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ))}
                </div>
              </div>

              {selectedRoom.status === "not-started" ||
              selectedRoom.status === "retry" ? (
                <button
                  onClick={() => {
                    window.location.href = "/camera";
                  }}
                  className="mt-7 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
                >
                  지금 인증하기
                </button>
              ) : (
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="mt-7 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
                >
                  확인
                </button>
              )}

              <button
                onClick={() => leaveRoom(selectedRoom.id)}
                className="mt-2 h-12 w-full text-sm font-semibold text-neutral-400"
              >
                방 나가기
              </button>
            </div>
          </section>
        </>
      )}

      {/* Discover Sheet */}

      {discoverOpen && (
        <>
          <button
            onClick={() => setDiscoverOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="새 방 찾기 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    DISCOVER
                  </p>

                  <h2 className="mt-1 text-3xl font-bold tracking-[-0.06em]">
                    새 방 찾기
                  </h2>
                </div>

                <button className="text-sm font-semibold text-neutral-400">
                  방 만들기
                </button>
              </div>

              <div className="mt-6 space-y-2">
                {discoverRooms.map((room) => {
                  const joined = joinedRoomIds.includes(room.id);

                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between rounded-2xl bg-[#f4f4f4] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {room.profiles.map((profile, index) => (
                            <img
                              key={index}
                              src={profile}
                              alt=""
                              className="h-10 w-10 rounded-full border-2 border-[#f4f4f4] object-cover"
                            />
                          ))}
                        </div>

                        <div>
                          <p className="font-semibold">{room.name}</p>
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {room.category} · {room.members}명
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleJoin(room.id)}
                        className={`h-10 rounded-full px-4 text-xs font-bold ${
                          joined
                            ? "bg-neutral-200 text-neutral-500"
                            : "bg-black text-white"
                        }`}
                      >
                        {joined ? "참여 중" : "참여"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Settings Sheet */}

      {settingsOpen && (
        <>
          <button
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            aria-label="설정 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <h2 className="text-2xl font-bold tracking-[-0.05em]">
                설정
              </h2>

              <div className="mt-5 rounded-3xl bg-[#f4f4f4] p-4">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${displayName} 프로필`}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff00ff] text-lg font-black text-white">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">
                      {displayName}
                    </p>
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

              <div className="mt-3 space-y-2">
                {[
                  "프로필 편집",
                  "알림 설정",
                  "인증 공개 범위",
                  "차단한 사용자",
                ].map((item) => (
                  <button
                    key={item}
                    className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#f4f4f4] px-4 text-sm font-semibold"
                  >
                    <span>{item}</span>

                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-black px-4 text-sm font-bold text-white"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {createRoomOpen && (
        <>
          <button
            onClick={() => setCreateRoomOpen(false)}
            className="
              fixed inset-0 z-40 
              bg-black/40 
              backdrop-blur-sm
            "
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div
              className="
                mx-auto 
                max-w-md 
                rounded-t-[36px]
                bg-white
                px-6
                pb-8
                pt-4
                shadow-2xl
              "
            >

              {/* handle */}
              <div
                className="
                  mx-auto
                  mb-7
                  h-1.5
                  w-12
                  rounded-full
                  bg-neutral-200
                "
              />


              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  새 방 만들기
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  함께 인증할 친구들과 새로운 습관을 시작해보세요.
                </p>
              </div>


              <div className="mt-7 space-y-4">

                <input
                  value={newRoomTitle}
                  onChange={(e)=>setNewRoomTitle(e.target.value)}
                  placeholder="방 이름"
                  maxLength={20}
                  className="
                    h-14
                    w-full
                    rounded-2xl
                    border
                    border-neutral-200
                    px-4
                    text-sm
                    outline-none
                    focus:border-black
                  "
                />


                <textarea
                  value={newRoomDescription}
                  onChange={(e)=>setNewRoomDescription(e.target.value)}
                  placeholder="방을 한 줄로 소개해주세요"
                  maxLength={50}
                  className="
                    min-h-[110px]
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-neutral-200
                    p-4
                    text-sm
                    outline-none
                    focus:border-black
                  "
                />

              </div>


              <button
                onClick={handleCreateRoom}
                disabled={!newRoomTitle.trim()}
                className="
                  mt-6
                  h-14
                  w-full
                  rounded-2xl
                  bg-black
                  font-semibold
                  text-white
                  transition
                  disabled:opacity-40
                "
              >
                만들기
              </button>


            </div>
          </section>
        </>
      )}
    </main>
  );
}