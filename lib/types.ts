export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type Spot = {
  id: string;
  name: string;
  prefecture: string;
  country: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  userId: string;
  spotId: string;
  createdAt: string;
};

export type PostImage = {
  id: string;
  postId: string;
  imageUrl: string;
  createdAt: string;
};

export type Like = {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
};

export type Database = {
  users: User[];
  posts: Post[];
  postImages: PostImage[];
  spots: Spot[];
  likes: Like[];
  sessions: Session[];
};

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
