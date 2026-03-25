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
  lat: number | null;
  lng: number | null;
  hasLiked: boolean;
};
