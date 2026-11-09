#!/usr/bin/env python3
"""Turn the raw farm art in assets/farm into small webp files in anylearn_v2/public/farm.

Raw files from the image tool are 1 to 2 MB each and some have a white background instead of
transparency. This script removes that white background (flood fill from the edges, so white
inside a picture is kept), trims the empty border of icons and characters, shrinks everything and
writes webp. Run it again after adding or replacing a file: python3 scripts/farm_assets.py
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.join(os.path.dirname(__file__), '..', 'assets', 'farm')
OUT = os.path.join(os.path.dirname(__file__), '..', 'anylearn_v2', 'public', 'farm')


def clear_background(img):
    """Make a baked-in background transparent when the picture has none.

    Handles a white or fake checkerboard background (light grey and white squares) and a black
    background. Only pixels connected to the border are removed, so white or black inside the
    picture stays. Pictures that already have transparency are returned as they are.
    """
    img = img.convert('RGBA')
    w, h = img.size
    a = np.array(img)
    if a[..., 3].min() < 255:
        # already transparent: drop the pale semi-transparent glow some pictures carry as a box around the object
        ghost = (a[..., 3] < 235) & (a[..., :3].min(axis=2) > 190)
        a[..., 3] = np.where(ghost, 0, a[..., 3])
        return Image.fromarray(a, 'RGBA')
    rgb = a[..., :3].astype(int)
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    corner = rgb[0, 0]
    if corner.min() > 200:
        cand = (mn > 185) & ((mx - mn) < 22)
    elif corner.max() < 60:
        cand = mx < 75
    else:
        return img
    mask = Image.fromarray((cand * 255).astype('uint8'), 'L').convert('RGB')
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for pt in border:
        if mask.getpixel(pt) == (255, 255, 255):
            ImageDraw.floodfill(mask, pt, (255, 0, 0))
    m = np.array(mask)
    bg = Image.fromarray((((m[..., 0] == 255) & (m[..., 1] == 0)) * 255).astype('uint8'), 'L').filter(ImageFilter.MaxFilter(3))
    a[..., 3] = np.where(np.array(bg) > 0, 0, 255)
    return Image.fromarray(a, 'RGBA')


def save(img, name, width, trim, quality=82):
    if trim:
        box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if box:
            img = img.crop(box)
    img.thumbnail((width, width * 2), Image.LANCZOS)
    img.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=quality, method=6)


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.png'):
            continue
        name = f[:-4]
        img = Image.open(os.path.join(SRC, f))
        if name.startswith('bg_'):
            save(img.convert('RGB').convert('RGBA'), name, 1280 if name.endswith('desktop') else 900, False, 78)
        elif name.startswith(('plot_', 'tree_slot', 'ca_rot', 'compost_bin', 'farmhouse', 'mailbox', 'market', 'well')) or name == 'order_board':
            # scenery and plants keep the whole canvas so they line up on a plot
            img = clear_background(img)
            save(img, name, 512 if name.startswith(('plot_', 'tree_slot', 'ca_rot')) else 640, name.endswith('product') or name == 'order_board')
        elif name == 'ui_sign_board':
            save(clear_background(img), name, 1100, True)
        else:
            save(clear_background(img), name, 384, True)
        total += os.path.getsize(os.path.join(OUT, name + '.webp'))
    print('wrote', len(os.listdir(OUT)), 'files,', round(total / 1024), 'KB')


if __name__ == '__main__':
    sys.exit(main())
