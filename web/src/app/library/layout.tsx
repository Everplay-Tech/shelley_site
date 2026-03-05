import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library | Shelley Guitar",
  description: "Your digital library — music, comics, games, and books from the Shelley Guitar universe.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
