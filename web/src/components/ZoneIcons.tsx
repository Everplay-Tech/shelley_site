// Pixel-art nav icons (PixelLab-generated 32x32 PNGs)
import Image from "next/image";

const iconProps = {
  width: 32,
  height: 32,
  "aria-hidden": true as const,
  className: "nav-pixel-icon",
  draggable: false as const,
};

export function HomeIcon() {
  return <Image {...iconProps} src="/images/nav/home.png" alt="" />;
}

export function WorkshopIcon() {
  return <Image {...iconProps} src="/images/nav/workshop.png" alt="" />;
}

export function GalleryIcon() {
  return <Image {...iconProps} src="/images/nav/gallery.png" alt="" />;
}

export function LibrarynthIcon() {
  return <Image {...iconProps} src="/images/nav/librarynth.png" alt="" />;
}

export function ContactIcon() {
  return <Image {...iconProps} src="/images/nav/contact.png" alt="" />;
}

export function ShopIcon() {
  return <Image {...iconProps} src="/images/nav/shop.png" alt="" />;
}

export function LibraryIcon() {
  return <Image {...iconProps} src="/images/nav/library.png" alt="" />;
}
