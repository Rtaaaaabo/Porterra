export type PostFeedItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
  spotName: string;
  prefecture: string;
  country: string;
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
  authorName: string;
  spotName: string;
  lat: number;
  lng: number;
  createdAt: string;
};
