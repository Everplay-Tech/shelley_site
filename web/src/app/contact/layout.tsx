import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get In Touch",
  description:
    "Custom build inquiry, collaboration idea, or just want to talk guitars? Reach Shelley Guitar through the Signal Tower.",
  openGraph: {
    title: "Get In Touch | Shelley Guitar",
    description: "Drop a signal. We're always listening.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
