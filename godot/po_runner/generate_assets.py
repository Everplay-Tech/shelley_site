#!/usr/bin/env python3
"""Generate po_runner environment assets in Djinn World style.

Creates tiling parallax backgrounds, obstacle sprites, and pickup sprites
using a dark bamboo forest palette inspired by the reference art.

Output goes to sprites/environment/ and sprites/objects/
"""

import random
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

# --- Palette: Djinn World (dark bamboo forest) ---
PALETTE = {
    "sky_dark": (10, 10, 15, 255),
    "sky_mid": (18, 18, 25, 255),
    "sky_glow": (25, 22, 35, 255),
    "bamboo_far": (20, 30, 18, 255),
    "bamboo_mid": (30, 45, 25, 255),
    "bamboo_near": (40, 60, 30, 255),
    "bamboo_highlight": (55, 80, 40, 255),
    "ground_dark": (35, 25, 18, 255),
    "ground_mid": (55, 40, 28, 255),
    "ground_light": (74, 55, 40, 255),  # wood=#4a3728
    "amber": (255, 191, 0, 255),  # brand amber
    "amber_dim": (180, 130, 0, 180),
    "amber_glow": (255, 210, 50, 120),
    "bone_white": (220, 210, 190, 255),
    "bone_shadow": (160, 145, 120, 255),
    "ghost_blue": (80, 100, 140, 180),
    "black": (0, 0, 0, 255),
    "transparent": (0, 0, 0, 0),
}

VIEWPORT_W = 640
VIEWPORT_H = 360

OUT_DIR = Path(__file__).parent
ENV_DIR = OUT_DIR / "sprites" / "environment"
OBJ_DIR = OUT_DIR / "sprites" / "objects"


def ensure_dirs():
    ENV_DIR.mkdir(parents=True, exist_ok=True)
    OBJ_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Background Layer: Far (dark sky + distant bamboo silhouettes + faint stars)
# ---------------------------------------------------------------------------
def generate_bg_far():
    img = Image.new("RGBA", (VIEWPORT_W, VIEWPORT_H), PALETTE["sky_dark"])
    draw = ImageDraw.Draw(img)

    # Subtle gradient from sky_dark at top to sky_mid at bottom
    for y in range(VIEWPORT_H):
        t = y / VIEWPORT_H
        r = int(10 + t * 8)
        g = int(10 + t * 8)
        b = int(15 + t * 10)
        draw.line([(0, y), (VIEWPORT_W, y)], fill=(r, g, b, 255))

    # Faint stars / particles
    random.seed(42)
    for _ in range(60):
        x = random.randint(0, VIEWPORT_W - 1)
        y = random.randint(0, int(VIEWPORT_H * 0.6))
        brightness = random.randint(40, 100)
        size = random.choice([1, 1, 1, 2])
        color = (brightness, brightness, brightness + 20, random.randint(80, 180))
        if size == 1:
            img.putpixel((x, y), color)
        else:
            draw.rectangle([x, y, x + 1, y + 1], fill=color)

    # Distant mountain silhouettes
    mountain_color = (15, 20, 15, 255)
    points = [(0, VIEWPORT_H)]
    x = 0
    random.seed(101)
    while x <= VIEWPORT_W:
        # Jagged peaks
        peak_y = random.randint(140, 220)
        points.append((x, peak_y))
        x += random.randint(30, 80)
    points.append((VIEWPORT_W, VIEWPORT_H))
    draw.polygon(points, fill=mountain_color)

    # Second mountain range, slightly closer
    mountain2_color = (20, 28, 18, 255)
    points2 = [(0, VIEWPORT_H)]
    x = 0
    random.seed(202)
    while x <= VIEWPORT_W:
        peak_y = random.randint(180, 250)
        points2.append((x, peak_y))
        x += random.randint(20, 60)
    points2.append((VIEWPORT_W, VIEWPORT_H))
    draw.polygon(points2, fill=mountain2_color)

    # Very distant bamboo silhouettes on the mountain ridge
    random.seed(303)
    for _ in range(25):
        bx = random.randint(0, VIEWPORT_W)
        by = random.randint(160, 230)
        stalk_h = random.randint(20, 50)
        stalk_w = random.randint(2, 4)
        color = (18, 25, 16, random.randint(100, 180))
        draw.rectangle([bx, by - stalk_h, bx + stalk_w, by], fill=color)
        # Leaf tufts at top
        for lx in range(-3, 4):
            ly = random.randint(-5, 0)
            if 0 <= bx + lx < VIEWPORT_W and 0 <= by - stalk_h + ly < VIEWPORT_H:
                img.putpixel((bx + lx, by - stalk_h + ly), color)

    # Faint atmospheric fog at horizon
    for y in range(220, 280):
        t = (y - 220) / 60
        alpha = int(30 * (1 - abs(t - 0.5) * 2))
        for x in range(0, VIEWPORT_W, 2):
            fog = (40, 50, 45, alpha)
            draw.point((x, y), fill=fog)

    img.save(ENV_DIR / "bg_far.png", "PNG")
    print(f"  Created bg_far.png ({VIEWPORT_W}x{VIEWPORT_H})")


# ---------------------------------------------------------------------------
# Background Layer: Mid (bamboo forest silhouettes)
# ---------------------------------------------------------------------------
def generate_bg_mid():
    img = Image.new("RGBA", (VIEWPORT_W, VIEWPORT_H), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    random.seed(444)

    # Bamboo stalks at medium distance
    stalk_positions = []
    x = 0
    while x < VIEWPORT_W:
        stalk_positions.append(x)
        x += random.randint(15, 35)

    for sx in stalk_positions:
        stalk_h = random.randint(100, 200)
        stalk_w = random.randint(4, 7)
        base_y = random.randint(280, 310)
        top_y = base_y - stalk_h

        # Main stalk - dark green silhouette
        shade = random.randint(0, 2)
        colors = [PALETTE["bamboo_far"], PALETTE["bamboo_mid"], (25, 38, 20, 220)]
        stalk_color = colors[shade]

        draw.rectangle([sx, top_y, sx + stalk_w, base_y], fill=stalk_color)

        # Bamboo node rings (every ~20px)
        node_y = base_y
        while node_y > top_y:
            node_color = (stalk_color[0] + 10, stalk_color[1] + 10, stalk_color[2] + 5, 255)
            draw.rectangle([sx - 1, node_y, sx + stalk_w + 1, node_y + 2], fill=node_color)
            node_y -= random.randint(15, 25)

        # Leaves at various heights
        for _ in range(random.randint(2, 5)):
            ly = random.randint(top_y, base_y - 30)
            leaf_dir = random.choice([-1, 1])
            leaf_len = random.randint(8, 18)
            leaf_color = (stalk_color[0] + 5, stalk_color[1] + 15, stalk_color[2] + 5,
                          random.randint(150, 220))
            # Leaf as small angled line
            for i in range(leaf_len):
                lx = sx + (stalk_w // 2) + (leaf_dir * i)
                ly_off = ly - abs(i - leaf_len // 2) // 2
                if 0 <= lx < VIEWPORT_W and 0 <= ly_off < VIEWPORT_H:
                    img.putpixel((lx, ly_off), leaf_color)
                    if ly_off + 1 < VIEWPORT_H:
                        img.putpixel((lx, ly_off + 1), leaf_color)

    # Ground fill for mid layer (dark earth)
    for y in range(285, VIEWPORT_H):
        t = (y - 285) / (VIEWPORT_H - 285)
        r = int(30 + t * 20)
        g = int(22 + t * 15)
        b = int(15 + t * 10)
        for x in range(VIEWPORT_W):
            if img.getpixel((x, y))[3] < 50:  # don't overwrite bamboo
                img.putpixel((x, y), (r, g, b, 255))

    img.save(ENV_DIR / "bg_mid.png", "PNG")
    print(f"  Created bg_mid.png ({VIEWPORT_W}x{VIEWPORT_H})")


# ---------------------------------------------------------------------------
# Foreground Ground Layer (textured ground with path, rocks)
# ---------------------------------------------------------------------------
def generate_fg_ground():
    # This is the ground strip that the player runs on
    ground_h = 55  # from y=305 to y=360
    img = Image.new("RGBA", (VIEWPORT_W, ground_h), PALETTE["ground_dark"])
    draw = ImageDraw.Draw(img)

    random.seed(555)

    # Ground texture - varied brown tones
    for y in range(ground_h):
        for x in range(VIEWPORT_W):
            t = y / ground_h
            base_r = int(45 + t * 20)
            base_g = int(32 + t * 12)
            base_b = int(22 + t * 8)
            # Add noise
            noise = random.randint(-8, 8)
            r = max(0, min(255, base_r + noise))
            g = max(0, min(255, base_g + noise))
            b = max(0, min(255, base_b + noise))
            img.putpixel((x, y), (r, g, b, 255))

    # Amber glow line at top of ground (the path edge)
    for x in range(VIEWPORT_W):
        intensity = random.randint(180, 255)
        alpha = random.randint(80, 160)
        draw.point((x, 0), fill=(intensity, int(intensity * 0.7), 0, alpha))
        draw.point((x, 1), fill=(intensity, int(intensity * 0.7), 0, alpha // 2))
        draw.point((x, 2), fill=(int(intensity * 0.5), int(intensity * 0.3), 0, alpha // 4))

    # Scattered pebbles
    for _ in range(40):
        px = random.randint(0, VIEWPORT_W - 4)
        py = random.randint(8, ground_h - 4)
        psize = random.randint(2, 4)
        shade = random.randint(50, 80)
        pcolor = (shade, shade - 10, shade - 15, 255)
        draw.ellipse([px, py, px + psize, py + psize], fill=pcolor)

    img.save(ENV_DIR / "fg_ground.png", "PNG")
    print(f"  Created fg_ground.png ({VIEWPORT_W}x{ground_h})")


# ---------------------------------------------------------------------------
# Obstacle: Bamboo Stump
# ---------------------------------------------------------------------------
def generate_obstacle_bamboo():
    w, h = 24, 40
    img = Image.new("RGBA", (w, h), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    # Main stump body
    stump_color = PALETTE["bamboo_near"]
    stump_dark = PALETTE["bamboo_mid"]
    stump_highlight = PALETTE["bamboo_highlight"]

    # Stump cylinder
    draw.rectangle([4, 0, 19, h - 1], fill=stump_color)

    # Left shadow edge
    draw.rectangle([4, 0, 7, h - 1], fill=stump_dark)

    # Right highlight edge
    draw.rectangle([16, 0, 19, h - 1], fill=stump_highlight)

    # Top cut surface (lighter, angled)
    draw.ellipse([3, -2, 20, 6], fill=(70, 95, 50, 255))
    draw.ellipse([5, -1, 18, 5], fill=(50, 70, 35, 255))

    # Bamboo node rings
    for ny in [10, 22, 34]:
        if ny < h:
            draw.rectangle([3, ny, 20, ny + 2], fill=(stump_color[0] + 15,
                                                        stump_color[1] + 15,
                                                        stump_color[2] + 10, 255))

    # Dark outline
    for y in range(h):
        for x in range(w):
            px = img.getpixel((x, y))
            if px[3] > 0:
                # Check neighbors for outline
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if img.getpixel((nx, ny))[3] == 0:
                            img.putpixel((nx, ny), (10, 15, 8, 255))

    img.save(OBJ_DIR / "obstacle_bamboo.png", "PNG")
    print(f"  Created obstacle_bamboo.png ({w}x{h})")


# ---------------------------------------------------------------------------
# Obstacle: Rock
# ---------------------------------------------------------------------------
def generate_obstacle_rock():
    w, h = 32, 28
    img = Image.new("RGBA", (w, h), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    # Rock body - irregular polygon
    rock_points = [
        (6, h - 1), (2, h - 8), (4, h - 16), (8, h - 22),
        (14, h - 26), (20, h - 27), (26, h - 24), (29, h - 18),
        (30, h - 10), (28, h - 1)
    ]
    draw.polygon(rock_points, fill=(60, 50, 40, 255))

    # Darker shadow on left
    shadow_points = [
        (6, h - 1), (2, h - 8), (4, h - 16), (8, h - 22),
        (14, h - 26), (14, h - 1)
    ]
    draw.polygon(shadow_points, fill=(40, 32, 25, 255))

    # Highlight on top-right
    highlight_points = [
        (14, h - 26), (20, h - 27), (26, h - 24), (22, h - 20),
        (16, h - 22)
    ]
    draw.polygon(highlight_points, fill=(80, 68, 55, 255))

    # Crack details
    draw.line([(14, h - 22), (16, h - 14), (14, h - 8)], fill=(30, 25, 18, 255), width=1)
    draw.line([(20, h - 20), (22, h - 12)], fill=(30, 25, 18, 255), width=1)

    # Outline
    temp = img.copy()
    for y in range(h):
        for x in range(w):
            px = temp.getpixel((x, y))
            if px[3] > 0:
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if temp.getpixel((nx, ny))[3] == 0:
                            img.putpixel((nx, ny), (15, 12, 8, 255))

    img.save(OBJ_DIR / "obstacle_rock.png", "PNG")
    print(f"  Created obstacle_rock.png ({w}x{h})")


# ---------------------------------------------------------------------------
# Obstacle: Mechanical Debris (spider mech leg fragment)
# ---------------------------------------------------------------------------
def generate_obstacle_mech():
    w, h = 28, 36
    img = Image.new("RGBA", (w, h), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    # Angled metal beam
    metal_dark = (45, 42, 38, 255)
    metal_mid = (70, 65, 58, 255)
    metal_light = (95, 88, 78, 255)

    # Main beam (angled)
    beam_points = [
        (4, h - 1), (2, h - 10), (6, h - 30), (10, h - 35),
        (18, h - 35), (22, h - 30), (20, h - 10), (18, h - 1)
    ]
    draw.polygon(beam_points, fill=metal_mid)

    # Shadow side
    shadow_pts = [
        (4, h - 1), (2, h - 10), (6, h - 30), (10, h - 35),
        (12, h - 35), (8, h - 30), (6, h - 10), (8, h - 1)
    ]
    draw.polygon(shadow_pts, fill=metal_dark)

    # Highlight side
    hi_pts = [
        (16, h - 35), (18, h - 35), (22, h - 30), (20, h - 10),
        (18, h - 1), (16, h - 1), (18, h - 10), (20, h - 30)
    ]
    draw.polygon(hi_pts, fill=metal_light)

    # Rivets / bolts
    for ry in [h - 8, h - 18, h - 28]:
        draw.ellipse([9, ry, 13, ry + 3], fill=(100, 95, 85, 255))
        draw.point((10, ry + 1), fill=(120, 115, 105, 255))

    # Amber sparks / glow at broken end
    for _ in range(5):
        sx = random.randint(8, 16)
        sy = random.randint(0, 5)
        spark_color = (255, random.randint(150, 220), 0, random.randint(150, 255))
        draw.point((sx, sy), fill=spark_color)

    # Outline
    temp = img.copy()
    for y in range(h):
        for x in range(w):
            px = temp.getpixel((x, y))
            if px[3] > 0:
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if temp.getpixel((nx, ny))[3] == 0:
                            img.putpixel((nx, ny), (20, 18, 15, 255))

    img.save(OBJ_DIR / "obstacle_mech.png", "PNG")
    print(f"  Created obstacle_mech.png ({w}x{h})")


# ---------------------------------------------------------------------------
# Pickup: Glowing Orb (inspired by the orb in cast_of_characters reference)
# ---------------------------------------------------------------------------
def generate_pickup_orb():
    w, h = 16, 16
    img = Image.new("RGBA", (w, h), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    cx, cy = w // 2, h // 2

    # Outer glow
    for y in range(h):
        for x in range(w):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if dist < 8:
                # Amber glow falloff
                t = dist / 8
                alpha = int(60 * (1 - t))
                r = int(255 * (1 - t * 0.3))
                g = int(200 * (1 - t * 0.4))
                b = int(50 * (1 - t))
                img.putpixel((x, y), (r, g, b, alpha))

    # Core orb
    draw.ellipse([cx - 5, cy - 5, cx + 4, cy + 4], fill=(255, 210, 50, 240))

    # Inner highlight
    draw.ellipse([cx - 3, cy - 3, cx + 2, cy + 2], fill=(255, 235, 120, 255))

    # Hot center
    draw.ellipse([cx - 1, cy - 2, cx + 1, cy], fill=(255, 255, 200, 255))

    # Sparkle points
    sparkle = (255, 255, 180, 200)
    for dx, dy in [(0, -6), (0, 6), (-6, 0), (6, 0)]:
        sx, sy = cx + dx, cy + dy
        if 0 <= sx < w and 0 <= sy < h:
            img.putpixel((sx, sy), sparkle)

    img.save(OBJ_DIR / "pickup_orb.png", "PNG")
    print(f"  Created pickup_orb.png ({w}x{h})")


# ---------------------------------------------------------------------------
# Pickup: Guitar Pick (amber, matches ScorePanel icon)
# ---------------------------------------------------------------------------
def generate_pickup_pick():
    w, h = 14, 16
    img = Image.new("RGBA", (w, h), PALETTE["transparent"])
    draw = ImageDraw.Draw(img)

    # Guitar pick shape (pointed at bottom, rounded at top)
    pick_points = [
        (7, 15),   # bottom point
        (2, 8),    # left mid
        (1, 4),    # left upper
        (3, 1),    # top left
        (7, 0),    # top center
        (11, 1),   # top right
        (13, 4),   # right upper
        (12, 8),   # right mid
    ]
    draw.polygon(pick_points, fill=PALETTE["amber"])

    # Shadow on left
    shadow_pts = [(7, 15), (2, 8), (1, 4), (3, 1), (7, 0), (7, 15)]
    draw.polygon(shadow_pts, fill=PALETTE["amber_dim"])

    # Highlight
    draw.ellipse([5, 3, 10, 8], fill=(255, 220, 80, 200))

    # "S" emboss (for Shelley)
    draw.point((6, 4), fill=(200, 150, 0, 255))
    draw.point((7, 4), fill=(200, 150, 0, 255))
    draw.point((6, 5), fill=(200, 150, 0, 255))
    draw.point((7, 6), fill=(200, 150, 0, 255))
    draw.point((6, 7), fill=(200, 150, 0, 255))
    draw.point((7, 7), fill=(200, 150, 0, 255))

    # Outline
    temp = img.copy()
    for y in range(h):
        for x in range(w):
            px = temp.getpixel((x, y))
            if px[3] > 50:
                for ddx, ddy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + ddx, y + ddy
                    if 0 <= nx < w and 0 <= ny < h:
                        if temp.getpixel((nx, ny))[3] < 50:
                            img.putpixel((nx, ny), (80, 60, 0, 255))

    img.save(OBJ_DIR / "pickup_pick.png", "PNG")
    print(f"  Created pickup_pick.png ({w}x{h})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ensure_dirs()
    print("Generating Djinn World assets for po_runner...")
    print()

    print("[Backgrounds]")
    generate_bg_far()
    generate_bg_mid()
    generate_fg_ground()
    print()

    print("[Obstacles]")
    generate_obstacle_bamboo()
    generate_obstacle_rock()
    generate_obstacle_mech()
    print()

    print("[Pickups]")
    generate_pickup_orb()
    generate_pickup_pick()
    print()

    print("Done! Assets generated:")
    print(f"  Backgrounds: {ENV_DIR}/")
    print(f"  Objects:     {OBJ_DIR}/")


if __name__ == "__main__":
    main()
