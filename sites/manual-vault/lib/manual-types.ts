export const categories = [
  "音频设备",
  "键盘与外设",
  "智能家居",
  "影像设备",
  "其他设备",
] as const;
export type Category = (typeof categories)[number];
export type Procedure = {
  title: string;
  kind: "bluetooth" | "reset" | "stereo" | "mode" | "other";
  steps: string[];
  warning: string;
  evidence: string;
};
export type Extraction = {
  text: string;
  summary: string;
  features: { title: string; evidence: string }[];
  procedures: Procedure[];
  unreadable: boolean;
};
export type ManualPage = {
  id: string;
  productId: string;
  filename: string;
  mime: string;
  size: number;
  sha256: string;
  createdAt: string;
  extraction: Extraction | null;
  reviewed: boolean;
};
export type Product = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: Category;
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};
export type Library = {
  products: Product[];
  pages: ManualPage[];
  aiEnabled: boolean;
};
