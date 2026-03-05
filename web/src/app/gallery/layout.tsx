import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Gallery",
  description:
    "Finished Shelley guitars — each one built from scratch, voiced by hand, and unrepeatable. Follow the builds on Instagram.",
  openGraph: {
    title: "The Gallery | Shelley Guitar",
    description:
      "Finished Shelley guitars — each one voiced by hand and unrepeatable.",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
