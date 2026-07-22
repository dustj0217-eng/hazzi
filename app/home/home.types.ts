export type ReviewDecision = "approved" | "rejected";

export type HomeMember = {
  userId: string;
  display_name: string;
  avatarUrl: string | null;
};

export type HomeRoom = {
  id: number;
  name: string;
  description: string | null;
  members: HomeMember[];
};

export type FeedReviewer = {
  userId: string;
  display_name: string;
  avatarUrl: string | null;
};

export type HomeFeed = {
  id: string;
  roomId: number;
  userId: string;

  display_name: string;
  profileUrl: string | null;

  videoPath: string;
  videoUrl: string;

  createdAt: string;
  verificationDate: string;

  status: "pending" | "approved" | "rejected";

  approvedBy: FeedReviewer[];
  rejectedBy: FeedReviewer[];

  myDecision: ReviewDecision | null;
  myReason: string | null;
};

export type HomeMemberSlot = {
  member: HomeMember;
  feed: HomeFeed | null;
};

export type SubmitReviewInput = {
  verificationId: string;
  decision: ReviewDecision;
  reason?: string | null;
};

export type SubmitReviewResult = {
  decision: ReviewDecision;
  reason: string | null;
};

export type SendNudgeInput = {
  roomId: number;
  receiverId: string;
  message: string;
};

export type SendNudgeResult = {
  id: string;
  message: string;
  createdAt: string;
};