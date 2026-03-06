import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Your space. Saves, orders, rewards, and everything that's yours at Shelley Guitar.",
  openGraph: {
    title: "Account | Shelley Guitar",
    description:
      "Your space. Saves, orders, rewards, and everything that's yours.",
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
