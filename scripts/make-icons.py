import struct, zlib

BG = (7, 14, 31)
GOLD = (240, 168, 50)
CYAN = (45, 212, 255)
LINE = (31, 48, 84)


def inside_round(x, y, size, radius):
    cx = min(max(x, radius), size - 1 - radius)
    cy = min(max(y, radius), size - 1 - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def render(size):
    unit = size / 512
    rects = [
        (170, 120, 62, 252, GOLD),
        (170, 120, 190, 58, GOLD),
        (170, 224, 150, 50, GOLD),
        (150, 394, 212, 12, CYAN),
    ]
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            if not inside_round(x, y, size, int(112 * unit)):
                row += bytes((0, 0, 0, 0))
                continue
            color = BG
            border = int(26 * unit)
            if border <= x < size - border and border <= y < size - border:
                edge = min(x - border, size - border - 1 - x, y - border, size - border - 1 - y)
                if edge < max(1, int(4 * unit)) and inside_round(x, y, size, int(90 * unit) + border):
                    color = LINE
            for rx, ry, rw, rh, rc in rects:
                if rx * unit <= x < (rx + rw) * unit and ry * unit <= y < (ry + rh) * unit:
                    color = rc
            row += bytes(color + (255,))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


for size in (192, 512):
    with open(f"public/icon-{size}.png", "wb") as handle:
        handle.write(render(size))
