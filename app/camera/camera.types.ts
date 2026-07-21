export type CameraStep =
  | "requesting"
  | "camera"
  | "recording"
  | "preview"
  | "uploading"
  | "complete"
  | "error";

export type CameraFacing = "user" | "environment";

export type CameraRoomMember = {
  userId: string;
  display_name: string;
  avatarUrl: string | null;
};

export type CameraRoom = {
  id: number;
  name: string;
  description: string | null;
  members: CameraRoomMember[];
};

export type VerificationRecord = {
  id: string;
  roomId: number;
  userId: string;
  videoPath: string;
  durationSeconds: number;
  status: "pending" | "approved" | "rejected";
  verificationDate: string;
  createdAt: string;
};

export type UploadVerificationInput = {
  roomId: number;
  blob: Blob;
  durationSeconds: number;
  onProgress?: (progress: number) => void;
};

export type UploadVerificationResult = {
  verification: VerificationRecord;
};