"""Generate the PWA icons without any image library.

Draws a dark rounded square with three overlapping colour swatches
(navy, camel, white) and writes PNGs with zlib + struct only.
Run: python scripts/make-icons.py
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public'

BG = (20, 20, 22)
NAVY = (30, 42, 71)
CAMEL = (185, 131, 79)
WHITE = (255, 255, 255)
BURGUNDY = (110, 31, 47)


def blend(dst, src, a):
    return tuple(int(dst[i] * (1 - a) + src[i] * a) for i in range(3))


def rounded_rect_cov(x, y, size, radius):
    """Coverage (0..1) of a pixel centre inside a rounded square filling the canvas."""
    half = size / 2
    dx = max(abs(x - half) - (half - radius), 0)
    dy = max(abs(y - half) - (half - radius), 0)
    d = math.hypot(dx, dy) - radius
    return min(1, max(0, 0.5 - d))


def circle_cov(x, y, cx, cy, r):
    d = math.hypot(x - cx, y - cy) - r
    return min(1, max(0, 0.5 - d))


def render(size, maskable):
    px = bytearray()
    radius = 0 if maskable else size * 0.22
    # Maskable icons must keep content inside the central 80% safe zone
    scale = 0.8 if maskable else 1.0
    c = size / 2
    r = size * 0.22 * scale
    circles = [
        (c - size * 0.17 * scale, c + size * 0.08 * scale, NAVY),
        (c + size * 0.17 * scale, c + size * 0.08 * scale, CAMEL),
        (c, c - size * 0.16 * scale, WHITE),
    ]
    for y in range(size):
        for x in range(size):
            fx, fy = x + 0.5, y + 0.5
            cov = 1.0 if maskable else rounded_rect_cov(fx, fy, size, radius)
            col = BG
            for cx, cy, cc in circles:
                a = circle_cov(fx, fy, cx, cy, r)
                if a > 0:
                    col = blend(col, cc, a * 0.96)
            alpha = int(255 * cov)
            px += bytes(col) + bytes([alpha])
    return bytes(px)


def png(size, rgba):
    raw = b''.join(b'\x00' + rgba[y * size * 4:(y + 1) * size * 4] for y in range(size))

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


def main():
    OUT.mkdir(exist_ok=True)
    for name, size, maskable in [
        ('icon-192.png', 192, False),
        ('icon-512.png', 512, False),
        ('icon-512-maskable.png', 512, True),
        ('apple-touch-icon.png', 180, True),
    ]:
        (OUT / name).write_bytes(png(size, render(size, maskable)))
        print('wrote', name)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="rgb{BG}"/>
  <circle cx="33" cy="58" r="22" fill="rgb{NAVY}"/>
  <circle cx="67" cy="58" r="22" fill="rgb{CAMEL}"/>
  <circle cx="50" cy="34" r="22" fill="rgb{WHITE}"/>
</svg>
'''
    (OUT / 'icon.svg').write_text(svg, encoding='utf-8')
    print('wrote icon.svg')


if __name__ == '__main__':
    main()
