import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Librarynth",
  description:
    "A labyrinth of rooms beneath the workshop. Guitar science, build journals, the Xeno Myth archives. The Crystal Archive remembers everything.",
  openGraph: {
    title: "The Librarynth | Shelley Guitar",
    description:
      "A labyrinth of rooms beneath the workshop. The Crystal Archive remembers everything.",
  },
};

export default function LibrarynthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
