import type { FaqCategory } from "@/config/site";

export type Service = {
  id: string;
  name: string;
  short_description: string;
  full_description: string;
  image_path: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectPhoto = {
  id: string;
  project_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
};

export type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  service_id: string;
  general_area: string;
  completion_date: string | null;
  cover_photo_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectWithPhotos = PortfolioProject & {
  service: { id: string; name: string } | null;
  photos: ProjectPhoto[];
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};
