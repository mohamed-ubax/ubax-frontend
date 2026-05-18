export type BienDocument = {
  readonly id: string;
  readonly name: string;
  readonly fileUrl: string;
};

export type BienMetric = {
  readonly label: string;
  readonly value: string;
};

export type BienGalleryItem = {
  readonly key: string;
  readonly src: string | null;
  readonly alt: string;
  readonly isPlaceholder: boolean;
};

export type BienComment = {
  readonly author: string;
  readonly avatar: string;
  readonly rating: number;
  readonly review: string;
};

export type BienVideo = {
  readonly key: string;
  readonly fileUrl: string;
  readonly playbackUrl: string;
  readonly fileName?: string;
  readonly mimeType?: string;
};
