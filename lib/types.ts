import type { PostVisibilityValue } from "@/lib/post-visibility";

export type PostFilters = {
  country?: string;
  prefecture?: string;
  city?: string;
  takenYear?: number;
};

export type FilterOptions = {
  locations: Array<{ country: string; prefecture: string; city: string }>;
  years: number[];
};

export type PostFeedItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  visibility: PostVisibilityValue;
  authorName: string;
  spotName: string;
  city: string;
  prefecture: string;
  country: string;
  lat: number | null;
  lng: number | null;
  imageUrls: string[];
  likeCount: number;
};

export type PostDetail = PostFeedItem & {
  authorId: string;
  lat: number | null;
  lng: number | null;
  hasLiked: boolean;
};

export type PostMapPoint = {
  id: string;
  title: string;
  visibility: PostVisibilityValue;
  authorName: string;
  spotName: string;
  city: string;
  prefecture: string;
  country: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type VisibilitySelectableUser = {
  id: string;
  name: string;
  email: string;
};

export type FriendUser = {
  id: string;
  name: string;
  email: string;
};

export type FriendRequest = {
  /** friendships の行 id */
  id: string;
  user: FriendUser;
  createdAt: string;
};

export type FriendsOverview = {
  /** 承認済みの友達 */
  friends: FriendUser[];
  /** 自分あてに届いている申請（承認・拒否できる） */
  received: FriendRequest[];
  /** 自分が送っていて、まだ返事がない申請 */
  sent: FriendRequest[];
  /** まだ関係がなく、申請を送れる相手 */
  candidates: FriendUser[];
};
