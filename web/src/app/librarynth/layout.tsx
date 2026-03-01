import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Librarynth",
  description:
    "Study space meets creative labyrinth. Explore the Xeno Myth universe, guitar philosophy, creative arms, and meet the cast of Shelley Guitar.",
  openGraph: {
    title: "The Librarynth | Shelley Guitar",
    description:
      "Study space meets creative labyrinth. Everything Shelley, all in one place.",
  },
};

export default function LibrarynthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
