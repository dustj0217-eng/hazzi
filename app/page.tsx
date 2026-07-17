"use client";

import Link from "next/link";
import { useState } from "react";

const feeds = [
  {
    id: 1,
    name: "민지",
    image: "/images/sample1.jpg",
    profile: "/images/profile7.jpg",
    approved: [
      "/images/profile2.jpg",
      "/images/profile3.jpg",
      "/images/profile4.jpg",
    ],
  },
  {
    id: 2,
    name: "준호",
    image: "/images/sample2.jpg",
    profile: "/images/profile2.jpg",
    approved: ["/images/profile7.jpg", "/images/profile4.jpg"],
  },
  {
    id: 3,
    name: "소연",
    image: "/images/sample3.jpg",
    profile: "/images/profile3.jpg",
    approved: [],
  },
];

const rooms = [
  {
    id: 1,
    name: "공부방",
    members: [
      "/images/profile7.jpg",
      "/images/profile2.jpg",
      "/images/profile3.jpg",
      "/images/profile1.jpg",
    ],
  },
  {
    id: 2,
    name: "운동방",
    members: ["/images/profile2.jpg", "/images/profile4.jpg"],
  },
  {
    id: 3,
    name: "친구방",
    members: [
      "/images/profile5.jpg",
      "/images/profile6.jpg",
    ],
  },
];

export default function Page() {
  const [roomOpen, setRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [approvedFeeds, setApprovedFeeds] = useState<number[]>([]);
  const [rejectedFeeds, setRejectedFeeds] = useState<number[]>([]);

  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectFeedId, setRejectFeedId] = useState<number | null>(null);

  const rejectReasons = [
    "증거가 부족해요",
    "사진만으로 판단하기 어려워요",
    "조건을 충족하지 않은 것 같아요",
    "사실인지 모르겠어요",
    "잘 모르겠어요",
  ];

  const toggleApprove = (id: number) => {
    setApprovedFeeds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );

    // 인정하면 인정 안함은 해제
    setRejectedFeeds((prev) => prev.filter((item) => item !== id));
  };

  const toggleReject = (id: number) => {
    setRejectedFeeds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );

    // 인정 안함하면 인정은 해제
    setApprovedFeeds((prev) => prev.filter((item) => item !== id));
  };

  const submitReject = (reason: string) => {
    if (rejectFeedId === null) return;

    console.log("인정 안함 이유 :", reason);

    toggleReject(rejectFeedId);

    setRejectSheetOpen(false);
    setRejectFeedId(null);
  };

  return (
    <main className="relative min-h-screen pb-22 text-[#111111]">
      {/* 고정 배경 */}
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
      <header className="sticky top-0 z-30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pb-3 pt-5">
          <img
            src="/images/logo.png"
            alt="logo"
            width={200}
            height={50}
          />
          <button
            onClick={() => setRoomOpen(true)}
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex -space-x-2">
              {rooms
                .find((room) => room.id === selectedRoom)
                ?.members.slice(0, 3)
                .map((member, index) => (
                  <img
                    key={index}
                    src={member}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-white object-cover"
                  />
                ))}
            </div>

            <span className="pr-1 text-sm font-semibold">
              {rooms.find((room) => room.id === selectedRoom)?.name}
            </span>

            <span className="text-xs text-neutral-400">⌄</span>
          </button>
        </div>
      </header>

      {/* Feed */}

      <section className="mx-auto flex max-w-md grid grid-cols-2 gap-1 px-4 pt-2">
        {feeds.map((feed) => {
          const isApproved = approvedFeeds.includes(feed.id);
          const isRejected = rejectedFeeds.includes(feed.id);

          return (
            <article
              key={feed.id}
              className="relative overflow-hidden rounded-[28px] bg-neutral-200"
            >
              <div className="relative aspect-[1/1] overflow-hidden">
                <img
                  src={feed.image}
                  alt={`${feed.name} 인증`}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />

                {/* 인증한 사람 */}

                <div className="absolute left-3 top-3">
                  <div className="flex items-center gap-2 rounded-full bg-black/25 py-1.5 pl-1.5 pr-3 backdrop-blur-md">
                    <img
                      src={feed.profile}
                      alt={feed.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />

                    <span className="text-xs font-semibold text-white">
                      {feed.name}
                    </span>
                  </div>
                </div>

                {/* 승인한 사람들 */}

                <div className="absolute bottom-3 left-3">
                  {feed.approved.length > 0 || isApproved ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {feed.approved.map((profile, profileIndex) => (
                          <img
                            key={profileIndex}
                            src={profile}
                            alt=""
                            className="h-8 w-8 rounded-full border-2 border-white/80 object-cover"
                          />
                        ))}

                        {isApproved && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-black text-[10px] font-bold text-white">
                            ME
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-full bg-black/25 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-md">
                      x
                    </div>
                  )}
                </div>

                {/* 인정 버튼 */}
                <div className="absolute bottom-3 right-3 flex flex-col">
                  {/* 인정 */}
                  <button
                    onClick={() => toggleApprove(feed.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                      isApproved
                        ? "border-white bg-white text-black"
                        : "border-white/40 bg-white/20 text-white backdrop-blur-md"
                    }`}
                    aria-label="인정하기"
                  >
                    👍
                  </button>

                  {/* 인정 안함 */}
                  <button
                    onClick={() => {
                      setRejectFeedId(feed.id);
                      setRejectSheetOpen(true);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                      isRejected
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-white/40 bg-white/20 text-white backdrop-blur-md"
                    }`}
                    aria-label="인정 안하기"
                  >
                    👎
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {/* 내 인증 */}

        <Link href="/camera" className="group flex aspect-[1/1] items-center justify-between rounded-[28px] bg-white px-5 text-left transition active:scale-[0.99]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              My turn
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF00FF]">
            <span className="relative block h-4 w-4">
              <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-white" />
              <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-white" />
            </span>
          </div>
        </Link>
      </section>

      {/* Bottom Navigation */}

      <nav className="fixed bottom-4 left-0 right-0 z-30">
        <div className="mx-auto flex max-w-[280px] items-center justify-between rounded-full bg-[#FF00FF] px-3 py-3 shadow-2xl">
          <Link 
            href="/"
            className="flex h-11 min-w-20 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-black"
          >
            HOME
          </Link>

          <Link href="/camera" className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white text-black">
            <span className="h-4 w-4 rounded-full border-[3px] border-[#FF00FF]" />
          </Link>

          <Link href="/my" className="flex h-11 min-w-20 items-center justify-center rounded-full px-5 text-xs font-bold text-white/55">
            MY
          </Link>
        </div>
      </nav>

      {/* Room Sheet */}

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
                    인증할 방
                  </h2>
                </div>

                <button className="text-sm font-semibold text-neutral-400">
                  새 방
                </button>
              </div>

              <div className="space-y-2">
                {rooms.map((room) => {
                  const active = selectedRoom === room.id;

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room.id);
                        setRoomOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 transition ${
                        active
                          ? "bg-[#ff00ff] text-white"
                          : "bg-[#f4f4f4] text-black"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {room.members.slice(0, 3).map((member, index) => (
                            <img
                              key={index}
                              src={member}
                              alt=""
                              className={`h-9 w-9 rounded-full border-2 object-cover ${
                                active ? "border-black" : "border-[#f4f4f4]"
                              }`}
                            />
                          ))}
                        </div>

                        <span className="font-semibold">{room.name}</span>
                      </div>

                      <div
                        className={`h-3 w-3 rounded-full ${
                          active ? "bg-white" : "border border-neutral-300"
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

      {rejectSheetOpen && (
        <>
          <button
            onClick={() => setRejectSheetOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />

          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[32px] bg-white p-6">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-200" />

              <h3 className="text-xl font-bold">
                왜 인정하기 어려웠나요?
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                하나만 선택해주세요.
              </p>

              <div className="mt-6 space-y-2">
                {rejectReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => submitReject(reason)}
                    className="w-full rounded-2xl bg-neutral-100 px-4 py-4 text-left font-medium transition hover:bg-neutral-200"
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