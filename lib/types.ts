import type { PostVisibilityValue } from "@/lib/post-visibility";

export type PostFeedItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  visibility: PostVisibilityValue;
  authorName: string;
  spotName: string;
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
