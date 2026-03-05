// Pixel-art SVG nav icons (16x16, currentColor, crispEdges)
const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "currentColor",
  shapeRendering: "crispEdges" as const,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
};

export function HomeIcon() {
  return (
    <svg {...svgProps}>
      {/* Roof peak */}
      <rect x="7" y="2" width="2" height="1" />
      <rect x="6" y="3" width="4" height="1" />
      <rect x="5" y="4" width="6" height="1" />
      <rect x="4" y="5" width="8" height="1" />
      <rect x="3" y="6" width="10" height="1" />
      {/* Walls */}
      <rect x="4" y="7" width="8" height="6" />
      {/* Door */}
      <rect x="7" y="9" width="2" height="4" fillOpacity="0" />
      <rect x="4" y="7" width="3" height="6" />
      <rect x="9" y="7" width="3" height="6" />
      <rect x="7" y="11" width="2" height="2" />
      {/* Window left */}
      <rect x="5" y="8" width="1" height="1" fillOpacity="0.4" />
      {/* Window right */}
      <rect x="10" y="8" width="1" height="1" fillOpacity="0.4" />
    </svg>
  );
}

export function WorkshopIcon() {
  return (
    <svg {...svgProps}>
      {/* Guitar body */}
      <rect x="5" y="2" width="4" height="1" />
      <rect x="4" y="3" width="6" height="1" />
      <rect x="4" y="4" width="6" height="1" />
      <rect x="5" y="5" width="4" height="1" />
      <rect x="4" y="6" width="6" height="1" />
      <rect x="3" y="7" width="8" height="1" />
      <rect x="3" y="8" width="8" height="1" />
      <rect x="3" y="9" width="8" height="1" />
      <rect x="4" y="10" width="6" height="1" />
      <rect x="5" y="11" width="4" height="1" />
      {/* Neck */}
      <rect x="7" y="1" width="2" height="1" />
      {/* Sound hole */}
      <rect x="7" y="8" width="2" height="1" fillOpacity="0.3" />
      {/* Strings hint */}
      <rect x="8" y="3" width="1" height="8" fillOpacity="0.2" />
      {/* Saw blade - right side */}
      <rect x="12" y="5" width="1" height="6" />
      <rect x="13" y="6" width="1" height="1" />
      <rect x="13" y="8" width="1" height="1" />
      <rect x="13" y="10" width="1" height="1" />
    </svg>
  );
}

export function GalleryIcon() {
  return (
    <svg {...svgProps}>
      {/* Outer frame */}
      <rect x="2" y="3" width="12" height="1" />
      <rect x="2" y="12" width="12" height="1" />
      <rect x="2" y="3" width="1" height="10" />
      <rect x="13" y="3" width="1" height="10" />
      {/* Inner frame */}
      <rect x="3" y="4" width="10" height="1" fillOpacity="0.6" />
      <rect x="3" y="11" width="10" height="1" fillOpacity="0.6" />
      <rect x="3" y="4" width="1" height="8" fillOpacity="0.6" />
      <rect x="12" y="4" width="1" height="8" fillOpacity="0.6" />
      {/* Mountain scene inside */}
      <rect x="5" y="7" width="1" height="1" fillOpacity="0.3" />
      <rect x="6" y="6" width="1" height="2" fillOpacity="0.3" />
      <rect x="7" y="7" width="1" height="1" fillOpacity="0.3" />
      <rect x="8" y="8" width="1" height="1" fillOpacity="0.3" />
      <rect x="9" y="7" width="1" height="2" fillOpacity="0.3" />
      <rect x="10" y="6" width="1" height="3" fillOpacity="0.3" />
      {/* Sun */}
      <rect x="5" y="5" width="1" height="1" fillOpacity="0.5" />
      {/* Ground */}
      <rect x="4" y="9" width="8" height="1" fillOpacity="0.2" />
    </svg>
  );
}

export function LibrarynthIcon() {
  return (
    <svg {...svgProps}>
      {/* Book spine - closed book */}
      <rect x="3" y="2" width="10" height="1" />
      <rect x="3" y="13" width="10" height="1" />
      <rect x="3" y="2" width="1" height="12" />
      <rect x="12" y="2" width="1" height="12" />
      {/* Pages */}
      <rect x="4" y="3" width="8" height="10" fillOpacity="0.15" />
      {/* Spine detail */}
      <rect x="4" y="3" width="1" height="10" fillOpacity="0.4" />
      {/* Text lines */}
      <rect x="6" y="5" width="5" height="1" fillOpacity="0.3" />
      <rect x="6" y="7" width="4" height="1" fillOpacity="0.3" />
      <rect x="6" y="9" width="5" height="1" fillOpacity="0.3" />
      <rect x="6" y="11" width="3" height="1" fillOpacity="0.3" />
    </svg>
  );
}

export function ContactIcon() {
  return (
    <svg {...svgProps}>
      {/* Envelope body */}
      <rect x="2" y="4" width="12" height="8" fillOpacity="0.15" />
      <rect x="2" y="4" width="12" height="1" />
      <rect x="2" y="11" width="12" height="1" />
      <rect x="2" y="4" width="1" height="8" />
      <rect x="13" y="4" width="1" height="8" />
      {/* Envelope flap - V shape */}
      <rect x="3" y="5" width="1" height="1" fillOpacity="0.6" />
      <rect x="4" y="6" width="1" height="1" fillOpacity="0.6" />
      <rect x="5" y="7" width="1" height="1" fillOpacity="0.6" />
      <rect x="6" y="8" width="1" height="1" fillOpacity="0.6" />
      <rect x="7" y="8" width="2" height="1" fillOpacity="0.6" />
      <rect x="9" y="8" width="1" height="1" fillOpacity="0.6" />
      <rect x="10" y="7" width="1" height="1" fillOpacity="0.6" />
      <rect x="11" y="6" width="1" height="1" fillOpacity="0.6" />
      <rect x="12" y="5" width="1" height="1" fillOpacity="0.6" />
      {/* Signal waves */}
      <rect x="11" y="2" width="1" height="1" fillOpacity="0.4" />
      <rect x="12" y="1" width="1" height="1" fillOpacity="0.25" />
      <rect x="13" y="2" width="1" height="1" fillOpacity="0.15" />
    </svg>
  );
}
