"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CameraStep =
  | "requesting"
  | "camera"
  | "recording"
  | "preview"
  | "uploading"
  | "complete"
  | "error";

type CameraFacing = "user" | "environment";

type Room = {
  id: number;
  name: string;
  description: string;
  members: string[];
};

type UploadResult = {
  ok: boolean;
  certificationId?: string;
  videoUrl?: string;
  message?: string;
};

const RECORD_SECONDS = 3;

const rooms: Room[] = [
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

function getSupportedMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogv";
  return "webm";
}

export default function CameraPage() {
  const [step, setStep] = useState<CameraStep>("requesting");
  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);
  const [roomOpen, setRoomOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS);
  const [cameraFacing, setCameraFacing] =
    useState<CameraFacing>("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUseFlash = useMemo(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return false;

    const capabilities = track.getCapabilities?.() as
      | MediaTrackCapabilities & { torch?: boolean }
      | undefined;

    return Boolean(capabilities?.torch);
  }, [step, cameraFacing]);

  const clearTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const showError = useCallback(
    (message: string) => {
      clearTimers();
      setErrorMessage(message);
      setStep("error");
    },
    [clearTimers]
  );

  const startCamera = useCallback(
    async (facing: CameraFacing = cameraFacing) => {
      try {
        setStep("requesting");
        setErrorMessage("");
        clearTimers();
        stopStream();

        if (
          !navigator.mediaDevices?.getUserMedia ||
          typeof MediaRecorder === "undefined"
        ) {
          throw new Error(
            "이 브라우저에서는 카메라 녹화를 지원하지 않습니다. 최신 Chrome 또는 Safari로 다시 시도해 주세요."
          );
        }

        const constraints: MediaStreamConstraints = {
          audio: true,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9 / 16 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          await liveVideoRef.current.play().catch(() => undefined);
        }

        setFlashOn(false);
        setStep("camera");
      } catch (error) {
        const domError = error as DOMException | Error;

        if (
          "name" in domError &&
          (domError.name === "NotAllowedError" ||
            domError.name === "PermissionDeniedError")
        ) {
          showError(
            "카메라 또는 마이크 권한이 꺼져 있습니다. 브라우저 주소창의 권한 설정에서 카메라와 마이크를 허용해 주세요."
          );
          return;
        }

        if ("name" in domError && domError.name === "NotFoundError") {
          showError("사용할 수 있는 카메라를 찾지 못했습니다.");
          return;
        }

        showError(
          domError.message ||
            "카메라를 시작하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요."
        );
      }
    },
    [cameraFacing, clearTimers, showError, stopStream]
  );

  useEffect(() => {
    void startCamera("environment");

    return () => {
      clearTimers();
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // initial mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!liveVideoRef.current || !streamRef.current) return;
    liveVideoRef.current.srcObject = streamRef.current;
  }, [step]);

  const toggleCamera = async () => {
    if (step === "recording" || step === "uploading") return;

    const nextFacing: CameraFacing =
      cameraFacing === "user" ? "environment" : "user";

    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.() as
      | MediaTrackCapabilities & { torch?: boolean }
      | undefined;

    if (!capabilities?.torch) {
      setErrorMessage("현재 카메라는 플래시를 지원하지 않습니다.");
      return;
    }

    try {
      const next = !flashOn;
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setFlashOn(next);
      setErrorMessage("");
    } catch {
      setErrorMessage("플래시를 변경하지 못했습니다.");
    }
  };

  const stopRecording = useCallback(() => {
    clearTimers();

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, [clearTimers]);

  const startRecording = async () => {
    const stream = streamRef.current;

    if (!stream) {
      showError("카메라가 준비되지 않았습니다.");
      return;
    }

    try {
      revokePreviewUrl();
      setPreviewUrl("");
      setRecordedBlob(null);
      setUploadResult(null);
      setUploadProgress(0);
      setErrorMessage("");
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2_500_000,
            audioBitsPerSecond: 128_000,
          })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        showError("영상 녹화 중 오류가 발생했습니다.");
      };

      recorder.onstop = () => {
        clearTimers();

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size === 0) {
          showError("녹화된 영상이 비어 있습니다. 다시 촬영해 주세요.");
          return;
        }

        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setSecondsLeft(RECORD_SECONDS);
        setStep("preview");

        requestAnimationFrame(() => {
          if (previewVideoRef.current) {
            previewVideoRef.current.src = url;
            void previewVideoRef.current.play().catch(() => undefined);
          }
        });
      };

      recorder.start(250);
      setSecondsLeft(RECORD_SECONDS);
      setStep("recording");

      countdownRef.current = setInterval(() => {
        setSecondsLeft((current) => Math.max(0, current - 1));
      }, 1000);

      stopTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, RECORD_SECONDS * 1000);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "녹화를 시작하지 못했습니다."
      );
    }
  };

  const cancelRecording = () => {
    chunksRef.current = [];
    stopRecording();
    setRecordedBlob(null);
    setSecondsLeft(RECORD_SECONDS);
    setStep("camera");
  };

  const retake = async () => {
    revokePreviewUrl();
    setPreviewUrl("");
    setRecordedBlob(null);
    setUploadResult(null);
    setUploadProgress(0);
    setSecondsLeft(RECORD_SECONDS);
    setStep("camera");

    if (!streamRef.current) {
      await startCamera(cameraFacing);
    }
  };

  const uploadCertification = async () => {
    if (!recordedBlob) {
      showError("업로드할 영상이 없습니다.");
      return;
    }

    try {
      setStep("uploading");
      setUploadProgress(15);
      setErrorMessage("");

      const mimeType = recordedBlob.type || "video/webm";
      const extension = getExtension(mimeType);
      const file = new File(
        [recordedBlob],
        `certification-${Date.now()}.${extension}`,
        { type: mimeType }
      );

      const formData = new FormData();
      formData.append("video", file);
      formData.append("roomId", String(selectedRoom.id));
      formData.append("roomName", selectedRoom.name);
      formData.append("durationSeconds", String(RECORD_SECONDS));

      setUploadProgress(45);

      const response = await fetch("/api/certifications", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const result = (await response.json()) as UploadResult;

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "인증 업로드에 실패했습니다.");
      }

      setUploadResult(result);
      setUploadProgress(100);
      stopStream();
      setStep("complete");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "인증 업로드에 실패했습니다."
      );
      setStep("preview");
    }
  };

  const goBackToCamera = async () => {
    revokePreviewUrl();
    setPreviewUrl("");
    setRecordedBlob(null);
    setUploadResult(null);
    setUploadProgress(0);
    setSecondsLeft(RECORD_SECONDS);
    await startCamera(cameraFacing);
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <video
          ref={liveVideoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${
            cameraFacing === "user" ? "-scale-x-100" : ""
          }`}
        />

        {previewUrl && (
          <video
            ref={previewVideoRef}
            src={previewUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/65 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={() => window.history.back()}
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
          disabled={step === "recording" || step === "uploading"}
          className="flex items-center gap-2 rounded-full bg-black/25 py-2 pl-2 pr-4 backdrop-blur-xl disabled:opacity-50"
        >
          <div className="flex -space-x-2">
            {selectedRoom.members.slice(0, 3).map((member, index) => (
              <img
                key={`${member}-${index}`}
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
          onClick={() => void toggleFlash()}
          disabled={!canUseFlash || step === "recording"}
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-xl disabled:opacity-35 ${
            flashOn ? "bg-white text-black" : "bg-black/25 text-white"
          }`}
          aria-label="플래시"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M13 2L5 14h6l-1 8 9-13h-6V2z" />
          </svg>
        </button>
      </header>

      {(step === "camera" || step === "recording") && (
        <>
          <section className="absolute inset-x-0 top-28 z-10 flex justify-center px-5">
            <div className="rounded-full bg-black/20 px-4 py-2 text-center backdrop-blur-md">
              <p className="text-sm font-medium">
                {step === "recording"
                  ? `${Math.max(secondsLeft, 0)}초`
                  : selectedRoom.description}
              </p>
            </div>
          </section>

          <div className="pointer-events-none absolute inset-x-5 bottom-52 top-24 z-10">
            <div className="relative h-full w-full">
              <span className="absolute left-0 top-0 h-8 w-8 border-l border-t border-white/80" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r border-t border-white/80" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/80" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b border-r border-white/80" />
            </div>
          </div>
        </>
      )}

      {step === "recording" && (
        <div className="absolute left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-4 py-2 backdrop-blur-lg">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold tracking-[0.16em]">
            RECORDING
          </span>
        </div>
      )}

      {step === "requesting" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black px-6">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="mt-5 text-sm font-semibold">카메라를 준비하고 있어요</p>
            <p className="mt-2 text-xs text-white/50">
              카메라와 마이크 권한을 허용해 주세요
            </p>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black px-5">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-black">
            <p className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
              CAMERA ERROR
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em]">
              카메라를 열 수 없어요
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {errorMessage}
            </p>

            <button
              onClick={() => void startCamera(cameraFacing)}
              className="mt-6 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
            >
              다시 시도
            </button>

            <button
              onClick={() => window.history.back()}
              className="mt-2 h-12 w-full text-sm font-semibold text-neutral-400"
            >
              이전 화면으로
            </button>
          </div>
        </div>
      )}

      {(step === "preview" || step === "uploading") && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/15">
          <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur-lg">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-semibold">
                {step === "uploading"
                  ? "인증을 보내고 있어요"
                  : "3초 인증 준비 완료"}
              </span>
            </div>
          </div>

          <div className="px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            <div className="rounded-[28px] bg-black/45 p-4 backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedRoom.members.slice(0, 3).map((member, index) => (
                      <img
                        key={`${member}-${index}`}
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

              {errorMessage && (
                <p className="mb-3 rounded-xl bg-red-500/20 px-3 py-2 text-xs text-red-100">
                  {errorMessage}
                </p>
              )}

              {step === "uploading" ? (
                <div className="py-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-white/60">
                    {uploadProgress}% 업로드 중
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_1.7fr] gap-2">
                  <button
                    onClick={() => void retake()}
                    className="h-14 rounded-2xl bg-white/10 text-sm font-semibold"
                  >
                    다시 찍기
                  </button>

                  <button
                    onClick={() => void uploadCertification()}
                    className="h-14 rounded-2xl bg-white text-sm font-bold text-black"
                  >
                    이대로 인증
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                      key={`${member}-${index}`}
                      src={member}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-[#f4f4f4] object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>

            {uploadResult?.certificationId && (
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                인증 번호: {uploadResult.certificationId}
              </p>
            )}

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-5 h-14 w-full rounded-2xl bg-black text-sm font-bold text-white"
            >
              홈으로 돌아가기
            </button>

            <button
              onClick={() => void goBackToCamera()}
              className="mt-2 h-12 w-full text-sm font-semibold text-neutral-400"
            >
              다른 방도 인증하기
            </button>
          </div>
        </div>
      )}

      {(step === "camera" || step === "recording") && (
        <section className="absolute inset-x-0 bottom-0 z-20 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md items-center justify-between px-8">
            <div className="h-12 w-12" />

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
                onClick={() => void startRecording()}
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/45"
                aria-label="촬영 시작"
              >
                <span className="h-20 w-20 rounded-full bg-white transition active:scale-90">
                  <span className="m-auto mt-2 block h-16 w-16 rounded-full border border-black/10" />
                </span>
              </button>
            )}

            <button
              onClick={() => void toggleCamera()}
              disabled={step === "recording"}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl disabled:opacity-40"
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

      {roomOpen && (
        <>
          <button
            onClick={() => setRoomOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-label="방 선택 닫기"
          />

          <section className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-md rounded-t-[34px] bg-white px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 text-black">
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
                              key={`${member}-${index}`}
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
