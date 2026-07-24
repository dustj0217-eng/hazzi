"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/nav";

import {
  getCurrentUser,
  getMyHomeRooms,
  getRoomFeeds,
  removeVerificationReview,
  submitVerificationReview,
  sendMemberNudge,
} from "./home.service";

import type {
  HomeFeed,
  HomeMember,
  HomeRoom,
} from "./home.types";

const rejectReasons = [
  "증거가 부족해요",
  "영상만으로 판단하기 어려워요",
  "조건을 충족하지 않은 것 같아요",
  "사실인지 모르겠어요",
  "잘 모르겠어요",
];

function Avatar({
  member,
  size = "sm",
  borderClassName = "border-white",
}: {
  member: Pick<HomeMember, "display_name" | "avatarUrl">;
  size?: "sm" | "md";
  borderClassName?: string;
}) {
  const sizeClassName = size === "md" ? "h-9 w-9" : "h-7 w-7";

  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.display_name}
        className={`${sizeClassName} rounded-full border-2 ${borderClassName} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center rounded-full border-2 ${borderClassName} bg-black text-[10px] font-bold text-white`}
      aria-label={member.display_name}
    >
      {member.display_name.slice(0, 1)}
    </div>
  );
}

function FeedCard({
  feed,
  busy,
  onApprove,
  onReject,
}: {
  feed: HomeFeed;
  busy: boolean;
  onApprove: (feed: HomeFeed) => void;
  onReject: (feed: HomeFeed) => void;
}) {
  const isApproved = feed.myDecision === "approved";
  const isRejected = feed.myDecision === "rejected";

  return (
    <article className="relative overflow-hidden rounded-[28px] bg-neutral-200">
      <div className="relative aspect-square overflow-hidden">
        <video
          src={feed.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />

        <div className="absolute left-3 top-3">
          <div className="flex items-center gap-2 rounded-full bg-black/25 py-1.5 pl-1.5 pr-3 backdrop-blur-md">
            <Avatar
              member={{
                display_name: feed.display_name,
                avatarUrl: feed.profileUrl,
              }}
            />

            <span className="max-w-20 truncate text-xs font-semibold text-white">
              {feed.display_name}
            </span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3">
          {feed.approvedBy.length > 0 ? (
            <div className="flex -space-x-2">
              {feed.approvedBy.slice(0, 3).map((reviewer) => (
                <Avatar
                  key={reviewer.userId}
                  member={reviewer}
                  size="md"
                  borderClassName="border-white/80"
                />
              ))}

              {feed.approvedBy.length > 3 && (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-black/70 text-[10px] font-bold text-white">
                  +{feed.approvedBy.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-full bg-black px-3 py-2 text-[11px] font-medium text-[#D8FF5A] backdrop-blur-md">
              아직 인정 없음
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={() => onApprove(feed)}
            disabled={busy}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-50 ${
              isApproved
                ? "border-[#D8FF5A] bg-[#D8FF5A] text-black"
                : "border-white/40 bg-white/20 text-white backdrop-blur-md"
            }`}
            aria-label="인정하기"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={isApproved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 10v10H4V10h3zm3 10h7.2a2 2 0 001.95-1.57l1.33-6A2 2 0 0018.53 10H15l.5-3.2A2.4 2.4 0 0013.13 4L9 10v10h1z" />
            </svg>
          </button>

          <button
            onClick={() => onReject(feed)}
            disabled={busy}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-50 ${
              isRejected
                ? "border-red-500 bg-red-500 text-white"
                : "border-white/40 bg-white/20 text-white backdrop-blur-md"
            }`}
            aria-label="인정 안 하기"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 rotate-180"
              fill={isRejected ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 10v10H4V10h3zm3 10h7.2a2 2 0 001.95-1.57l1.33-6A2 2 0 0018.53 10H15l.5-3.2A2.4 2.4 0 0013.13 4L9 10v10h1z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyMemberCard({
  member,
  isMine,
  onCall,
}: {
  member: HomeMember;
  isMine: boolean;
  onCall: (member: HomeMember) => void;
}) {
  return (
    <article className="relative flex aspect-square flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 p-3">
        <Avatar
          member={member}
          borderClassName="border-neutral-100"
        />

        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {member.display_name}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="mt-3 text-sm font-bold">
          아직 인증 전
        </p>

        <p className="mt-1 text-[10px] text-neutral-400">
          오늘의 습관, 같이 해볼까요?
        </p>
      </div>

      <div className="p-3 pt-0">
        {isMine ? (
          <Link
            href="/camera"
            className="flex h-10 w-full items-center justify-center rounded-full bg-[#FF00FF] text-xs font-bold text-white transition active:scale-[0.98]"
          >
            인증하기
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onCall(member)}
            className="flex h-10 w-full items-center justify-center rounded-full bg-black text-xs font-bold text-white"
          >
            호출하기
          </button>
        )}
      </div>
    </article>
  );
}

export default function HomePageClient() {
  const [rooms, setRooms] = useState<HomeRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [feeds, setFeeds] = useState<HomeFeed[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [roomOpen, setRoomOpen] = useState(false);
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectFeed, setRejectFeed] = useState<HomeFeed | null>(null);

  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [busyFeedId, setBusyFeedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const memberSlots = useMemo(() => {
    if (!selectedRoom) {
      return [];
    }

    return selectedRoom.members.map((member) => {
      const feed =
        feeds.find((item) => item.userId === member.userId) ?? null;

      return {
        member,
        feed,
      };
    });
  }, [selectedRoom, feeds]);

  const loadFeeds = useCallback(async (roomId: number) => {
    try {
      setFeedLoading(true);
      setErrorMessage("");

      const nextFeeds = await getRoomFeeds(roomId);
      setFeeds(nextFeeds);
    } catch (error) {
      setFeeds([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "피드를 불러오지 못했습니다."
      );
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [user, myRooms] = await Promise.all([
          getCurrentUser(),
          getMyHomeRooms(),
        ]);

        if (cancelled) return;

        setCurrentUserId(user.id);
        setRooms(myRooms);

        const firstRoomId = myRooms[0]?.id ?? null;
        setSelectedRoomId(firstRoomId);

        if (firstRoomId) {
          await loadFeeds(firstRoomId);
        }
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "홈 화면을 불러오지 못했습니다."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadFeeds]);

  const selectRoom = async (roomId: number) => {
    setSelectedRoomId(roomId);
    setRoomOpen(false);
    await loadFeeds(roomId);
  };

  const updateFeedDecision = (
    verificationId: string,
    decision: "approved" | "rejected" | null,
    reason: string | null = null
  ) => {
    setFeeds((currentFeeds) =>
      currentFeeds.map((feed) => {
        if (feed.id !== verificationId) return feed;

        return {
          ...feed,
          myDecision: decision,
          myReason: reason,
        };
      })
    );
  };

  const handleApprove = async (feed: HomeFeed) => {
    if (busyFeedId) return;

    try {
      setBusyFeedId(feed.id);
      setErrorMessage("");

      if (feed.myDecision === "approved") {
        await removeVerificationReview(feed.id);
        updateFeedDecision(feed.id, null);
        return;
      }

      await submitVerificationReview({
        verificationId: feed.id,
        decision: "approved",
      });

      updateFeedDecision(feed.id, "approved");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "인정 결과를 저장하지 못했습니다."
      );
    } finally {
      setBusyFeedId(null);
    }
  };

  const handleRejectOpen = async (feed: HomeFeed) => {
    if (busyFeedId) return;

    if (feed.myDecision === "rejected") {
      try {
        setBusyFeedId(feed.id);
        setErrorMessage("");
        await removeVerificationReview(feed.id);
        updateFeedDecision(feed.id, null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "인정 결과를 취소하지 못했습니다."
        );
      } finally {
        setBusyFeedId(null);
      }

      return;
    }

    setRejectFeed(feed);
    setRejectSheetOpen(true);
  };

  /* 호출하기 */

  const handleCallMember = async (member: HomeMember) => {
    if (!selectedRoomId) return;

    try {
      setErrorMessage("");

      await sendMemberNudge({
        roomId: selectedRoomId,
        receiverId: member.userId,
        message: "오늘도 같이 인증하자",
      });

      alert(`${member.display_name}님을 호출했어요.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "호출을 보내지 못했습니다."
      );
    }
  };

  const submitReject = async (reason: string) => {
    if (!rejectFeed || busyFeedId) return;

    try {
      setBusyFeedId(rejectFeed.id);
      setErrorMessage("");

      await submitVerificationReview({
        verificationId: rejectFeed.id,
        decision: "rejected",
        reason,
      });

      updateFeedDecision(rejectFeed.id, "rejected", reason);
      setRejectSheetOpen(false);
      setRejectFeed(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "인정 안 함 결과를 저장하지 못했습니다."
      );
    } finally {
      setBusyFeedId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
          <p className="mt-4 text-sm font-semibold text-neutral-500">
            홈을 준비하고 있어요
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pb-28 text-[#111111]">
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "linear-gradient(rgba(73, 109, 142, 0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(73, 109, 142, 0.10) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pb-3 pt-5">
          <img
            src="/images/logo.png"
            alt="hazzi"
            width={200}
            height={50}
            className="h-auto w-[140px] object-contain"
          />

          <button
            onClick={() => setRoomOpen(true)}
            disabled={rooms.length === 0}
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm disabled:opacity-50"
          >
            <div className="flex -space-x-2">
              {selectedRoom?.members.slice(0, 3).map((member) => (
                <Avatar key={member.userId} member={member} />
              ))}
            </div>

            <span className="max-w-24 truncate pr-1 text-sm font-semibold">
              {selectedRoom?.name ?? "방 없음"}
            </span>

            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 10l5 5 5-5" />
            </svg>
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-auto max-w-md px-4 pt-2">
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-md grid-cols-2 gap-1 px-4 pt-2">
        {feedLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-[28px] bg-neutral-200"
            />
          ))}

          {!feedLoading &&
            memberSlots.map(({ member, feed }) => {
              if (feed) {
                return (
                  <FeedCard
                    key={member.userId}
                    feed={feed}
                    busy={busyFeedId === feed.id}
                    onApprove={(targetFeed) =>
                      void handleApprove(targetFeed)
                    }
                    onReject={(targetFeed) =>
                      void handleRejectOpen(targetFeed)
                    }
                  />
                );
              }

              return (
                <EmptyMemberCard
                  key={member.userId}
                  member={member}
                  isMine={member.userId === currentUserId}
                  onCall={handleCallMember}
                />
              );
            })}
      </section>

      {!selectedRoom && (
        <div className="mx-auto max-w-md px-6 pt-20 text-center">
          <p className="text-xl font-bold">참여 중인 방이 없어요</p>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            방을 만들거나 참여하면 멤버들의 인증을 볼 수 있어요.
          </p>
        </div>
      )}

      <BottomNav />

      {roomOpen && (
        <>
          <button
            aria-label="닫기"
            onClick={() => setRoomOpen(false)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          />

          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4 shadow-2xl">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Rooms
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-[-0.05em]">
                    볼 방 선택
                  </h2>
                </div>
              </div>

              <div className="space-y-2">
                {rooms.map((room) => {
                  const active = selectedRoomId === room.id;

                  return (
                    <button
                      key={room.id}
                      onClick={() => void selectRoom(room.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 transition ${
                        active
                          ? "bg-[#FF00FF] text-white"
                          : "bg-[#f4f4f4] text-black"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex shrink-0 -space-x-2">
                          {room.members.slice(0, 3).map((member) => (
                            <Avatar
                              key={member.userId}
                              member={member}
                              size="md"
                              borderClassName={
                                active
                                  ? "border-[#FF00FF]"
                                  : "border-[#f4f4f4]"
                              }
                            />
                          ))}
                        </div>

                        <span className="truncate font-semibold">
                          {room.name}
                        </span>
                      </div>

                      <div
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          active
                            ? "bg-white"
                            : "border border-neutral-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {rejectSheetOpen && rejectFeed && (
        <>
          <button
            onClick={() => {
              setRejectSheetOpen(false);
              setRejectFeed(null);
            }}
            className="fixed inset-0 z-40 bg-black/40"
          />

          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[32px] bg-white p-6">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-200" />

              <h3 className="text-xl font-bold">
                왜 인정하기 어려웠나요?
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                하나만 선택해 주세요.
              </p>

              <div className="mt-6 space-y-2">
                {rejectReasons.map((reason) => (
                  <button
                    key={reason}
                    disabled={busyFeedId === rejectFeed.id}
                    onClick={() => void submitReject(reason)}
                    className="w-full rounded-2xl bg-neutral-100 px-4 py-4 text-left font-medium transition hover:bg-neutral-200 disabled:opacity-50"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
