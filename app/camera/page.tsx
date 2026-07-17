"use client";

import { useEffect, useRef, useState } from "react";

type CameraStep = "camera" | "recording" | "preview" | "complete";

const rooms = [
  {
    id: 1,
    name: "공부방",
    description: "오늘 공부하는 순간",
    members: [
      "/images/profile1.jpg",
      "/images/profile2.jpg",
      "/images/profile3.jpg",
    ],
  },
  {
    id: 2,
    name: "운동방",
    description: "몸을 움직인 순간",
    members: [
      "/images/profile2.jpg",
      "/images/profile3.jpg",
      "/images/profile4.jpg",
    ],
  },
  {
    id: 3,
    name: "친구방",
    description: "우리끼리 매일 인증",
    members: [
      "/images/profile1.jpg",
      "/images/profile4.jpg",
      "/images/profile5.jpg",
    ],
  },
];

export default function CameraPage() {
  const [step, setStep] = useState<CameraStep>("camera");
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]);
  const [roomOpen, setRoomOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [flashOn, setFlashOn] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== "recording") return;

    setSecondsLeft(3);

    timerRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          setStep("preview");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step]);

  const startRecording = () => {
    setStep("recording");
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSecondsLeft(3);
    setStep("camera");
  };

  const retake = () => {
    setSecondsLeft(3);
    setStep("camera");
  };

  const submitCertification = () => {
    setStep("complete");
  };

  const goBackToCamera = () => {
    setSecondsLeft(3);
    setStep("camera");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Camera Preview */}

      <div className="absolute inset-0">
        <img
          src="/images/camera-sample.jpg"
          alt="카메라 미리보기"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/65 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Top Header */}

      <header className="relative z-20 flex items-center justify-between px-5 pb-4 pt-5">
        <button
          onClick={() => history.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-xl"
          aria-label="뒤로 가기"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={() => setRoomOpen(true)}
          className="flex items-center gap-2 rounded-full bg-black/25 py-2 pl-2 pr-4 backdrop-blur-xl"
        >
          <div className="flex -space-x-2">
            {selectedRoom.members.slice(0, 3).map((member, index) => (
              <img
                key={index}
                src={member}
                alt=""
                className="h-7 w-7 rounded-full border-2 border-black/30 object-cover"
              />
            ))}
          </div>

          <span className="text-sm font-semibold">{selectedRoom.name}</span>

          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white/70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 10l5 5 5-5" />
          </svg>
        </button>

        <button
          onClick={() => setFlashOn((current) => !current)}
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-xl ${
            flashOn ? "bg-white text-black" : "bg-black/25 text-white"
          }`}
          aria-label="플래시"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M13 2L5 14h6l-1 8 9-13h-6V2z" />
          </svg>
        </button>
      </header>

      {/* Guide */}

      {(step === "camera" || step === "recording") && (
        <section className="absolute inset-x-0 top-28 z-10 flex justify-center px-5">
          <div className="rounded-full bg-black/20 px-4 py-2 text-center backdrop-blur-md">
            <p className="text-sm font-medium text-white">
              {step === "recording"
                ? `${secondsLeft}초`
                : selectedRoom.description}
            </p>
          </div>
        </section>
      )}

      {/* Focus Frame */}

      {(step === "camera" || step === "recording") && (
        <div className="pointer-events-none absolute inset-x-5 bottom-52 top-24 z-10">
          <div className="relative h-full w-full">
            <span className="absolute left-0 top-0 h-8 w-8 border-l border-t border-white/80" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r border-t border-white/80" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/80" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-white/80" />
          </div>
        </div>
      )}

      {/* Recording Indicator */}

      {step === "recording" && (
        <div className="absolute left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-4 py-2 backdrop-blur-lg">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold tracking-[0.16em]">
            RECORDING
          </span>
        </div>
      )}

      {/* Preview Overlay */}

      {step === "preview" && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/15">
          <div className="px-5 pt-6">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur-lg">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-semibold">3초 인증 준비 완료</span>
            </div>
          </div>

          <div className="px-5 pb-10">
            <div className="rounded-[28px] bg-black/45 p-4 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedRoom.members.slice(0, 3).map((member, index) => (
                      <img
                        key={index}
                        src={member}
                        alt=""
                        className="h-8 w-8 rounded-full border-2 border-black/30 object-cover"
                      />
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{selectedRoom.name}</p>
                    <p className="text-xs text-white/55">
                      방 멤버에게 인증을 요청합니다
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70">
                  오늘 1회
                </span>
              </div>

              <div className="grid grid-cols-[1fr_1.7fr] gap-2">
                <button
                  onClick={retake}
                  className="h-14 rounded-2xl bg-white/10 text-sm font-semibold text-white"
                >
                  다시 찍기
                </button>

                <button
                  onClick={submitCertification}
                  className="h-14 rounded-2xl bg-white text-sm font-bold text-black"
                >
                  이대로 인증
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed */}

      {step === "complete" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 px-5 backdrop-blur-xl">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-black">
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                  CERTIFIED
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em]">
                  인증을 보냈어요
                </h1>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12l4 4L19 6" />
                </svg>
              </div>
            </div>

            <div className="rounded-3xl bg-[#f4f4f4] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedRoom.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    멤버들의 인정을 기다리고 있어요
                  </p>
                </div>

                <div className="flex -space-x-2">
                  {selectedRoom.members.slice(0, 3).map((member, index) => (
                    <img
                      key={index}
                      src={member}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-[#f4f4f4] object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-5 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
            >
              홈으로 돌아가기
            </button>

            <button
              onClick={goBackToCamera}
              className="mt-2 h-12 w-full text-sm font-semibold text-neutral-400"
            >
              다른 방도 인증하기
            </button>
          </div>
        </div>
      )}

      {/* Camera Controls */}

      {(step === "camera" || step === "recording") && (
        <section className="absolute inset-x-0 bottom-0 z-20 pb-8">
          <div className="mx-auto flex max-w-md items-center justify-between px-8">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl"
              aria-label="최근 촬영 영상"
            >
              <div className="h-8 w-8 overflow-hidden rounded-xl bg-neutral-700">
                <img
                  src="/images/sample1.jpg"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </button>

            {step === "recording" ? (
              <button
                onClick={cancelRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/45"
                aria-label="촬영 취소"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                  <span className="h-7 w-7 rounded-md bg-black" />
                </span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/45"
                aria-label="촬영 시작"
              >
                <span className="h-20 w-20 rounded-full bg-white transition active:scale-90">
                  <span className="m-auto mt-2 block h-16 w-16 rounded-full border border-black/10" />
                </span>
              </button>
            )}

            <button
              onClick={() =>
                setCameraFacing((current) =>
                  current === "front" ? "back" : "front"
                )
              }
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl"
              aria-label="카메라 전환"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M20 7h-4l-2-2H10L8 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M8.5 13a3.5 3.5 0 006.5 1.8" />
                <path d="M15.5 11A3.5 3.5 0 009 9.2" />
                <path d="M15 16v-2h-2" />
                <path d="M9 8v2h2" />
              </svg>
            </button>
          </div>

          <p className="mt-4 text-center text-xs font-medium text-white/55">
            버튼을 누르면 3초 후 자동으로 종료됩니다
          </p>
        </section>
      )}

      {/* Room Sheet */}

      {roomOpen && (
        <>
          <button
            onClick={() => setRoomOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-label="방 선택 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-10 pt-4 text-black">
              <div className="mx-auto mb-7 h-1 w-10 rounded-full bg-neutral-200" />

              <div className="mb-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400">
                  SELECT ROOM
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-[-0.05em]">
                  어디에 인증할까요?
                </h2>
              </div>

              <div className="space-y-2">
                {rooms.map((room) => {
                  const active = selectedRoom.id === room.id;

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoom(room);
                        setRoomOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ${
                        active ? "bg-black text-white" : "bg-[#f4f4f4]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {room.members.slice(0, 3).map((member, index) => (
                            <img
                              key={index}
                              src={member}
                              alt=""
                              className={`h-10 w-10 rounded-full border-2 object-cover ${
                                active ? "border-black" : "border-[#f4f4f4]"
                              }`}
                            />
                          ))}
                        </div>

                        <div>
                          <p className="font-semibold">{room.name}</p>
                          <p
                            className={`mt-0.5 text-xs ${
                              active ? "text-white/55" : "text-neutral-400"
                            }`}
                          >
                            {room.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`h-3 w-3 rounded-full ${
                          active
                            ? "bg-white"
                            : "border border-neutral-300 bg-white"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}