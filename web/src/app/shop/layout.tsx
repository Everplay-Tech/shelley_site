import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The Shelley Shop — handcrafted guitars, picks, digital music, and more. Browse the shelves, grab what speaks to you.",
  openGraph: {
    title: "Shop | Shelley Guitar",
    description:
      "Handcrafted guitars, picks, digital music, and more from Shelley Guitar.",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
