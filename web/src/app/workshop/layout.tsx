import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Workshop",
  description:
    "Where wood meets steel and passion becomes music. See current builds, the build process, and tools at Shelley Guitar.",
  openGraph: {
    title: "The Workshop | Shelley Guitar",
    description: "Where wood meets steel and passion becomes music.",
  },
};

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
