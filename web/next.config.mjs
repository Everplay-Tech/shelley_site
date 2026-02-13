/** @type {import('next').NextConfig} */
const nextConfig = {
  // Godot HTML5 exports are served from public/games/ as static assets.
  // No special headers needed — games export single-threaded (no SharedArrayBuffer).
};

export default nextConfig;
