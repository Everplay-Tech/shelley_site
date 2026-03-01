import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Gallery",
  description:
    "Handcrafted instruments and the stories they carry. Browse guitar builds, specs, and the philosophy behind every Shelley guitar.",
  openGraph: {
    title: "The Gallery | Shelley Guitar",
    description:
      "Handcrafted instruments and the stories they carry.",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
