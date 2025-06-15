export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  createdAt: string;
  viewedBy: string[];
  // можно добавить текст, видео, реакции и т.д.
} 