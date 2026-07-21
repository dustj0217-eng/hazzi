export const RECORD_SECONDS = 3;

export function getSupportedMimeType() {
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

export function getExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogv";
  return "webm";
}

export function formatDateForPath(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createVerificationFile(blob: Blob) {
  const mimeType = blob.type || "video/webm";
  const extension = getExtension(mimeType);

  return new File(
    [blob],
    `verification-${crypto.randomUUID()}.${extension}`,
    { type: mimeType }
  );
}

export function getCameraErrorMessage(error: unknown) {
  const domError = error as DOMException | Error;

  if (
    "name" in domError &&
    (domError.name === "NotAllowedError" ||
      domError.name === "PermissionDeniedError")
  ) {
    return "카메라 또는 마이크 권한이 꺼져 있습니다. 브라우저 주소창의 권한 설정에서 카메라와 마이크를 허용해 주세요.";
  }

  if ("name" in domError && domError.name === "NotFoundError") {
    return "사용할 수 있는 카메라를 찾지 못했습니다.";
  }

  if ("name" in domError && domError.name === "NotReadableError") {
    return "다른 앱에서 카메라를 사용 중일 수 있습니다. 다른 앱을 닫고 다시 시도해 주세요.";
  }

  return domError.message || "카메라를 시작하지 못했습니다. 다시 시도해 주세요.";
}
