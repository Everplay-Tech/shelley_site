import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shelley Guitar shop — handcrafted guitars, picks, digital music, comics, and more from the world of Po.",
  openGraph: {
    title: "Shop | Shelley Guitar",
    description:
      "Handcrafted guitars, picks, digital music, comics, and more.",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
