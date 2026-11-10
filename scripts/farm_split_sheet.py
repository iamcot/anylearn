#!/usr/bin/env python3
"""Cut a crop sheet (one picture with all the growth stages of a plant) into the single pictures the game uses.

Put the sheet at assets/farm/<name>_sheet.png (or assets/farm/sheets/) (see plans/22-nong-trai-leo-crop-prompts.md), then run:
    python3 scripts/farm_split_sheet.py            # every sheet that is there
    python3 scripts/farm_split_sheet.py ot_tia_lua # one crop
    python3 scripts/farm_split_sheet.py --force    # also overwrite pictures that already exist
Layout: 2 x 2 cells = seedling, growing, ripe, product; a wide sheet (3 x 2) = sapling, grown, fruiting, resting, product.
The white background is removed, every plant stage is cut with the SAME box (so the plant keeps its size and its foot stays
on the same line from stage to stage), the product icon is trimmed. Output goes to assets/farm/<cropKey>_<stage>.png;
then run scripts/farm_assets.py to make the small webp files for the site.
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from farm_assets import clear_background  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'farm')
SHEETS = os.path.join(ROOT, 'sheets')
# Perennial sheets (3 x 2 cells); every other sheet is 2 x 2. The picture size is the same for both, so the name decides.
PERENNIAL_KEYS = {'bui_dau_sao_bang', 'cay_cam_mat_troi', 'cay_tao_ngoi_sao', 'hoa_mai_vang', 'buoi_mat_cuoi', 'cay_thong_keo_gay', 'cam_tu_cau_khai_giang'}
# Sheet name -> crop_key in farm_crops, when they differ.
ALIAS = {'rau_mam_suong_mai': 'rau_mam', 'bap_rang_no': 'bap_rang', 'khoai_lang_tim_mat_cuoi': 'khoai_cuoi',
         'day_leo_so_dem': 'day_so_dem', 'huong_duong_mat_cuoi': 'huong_duong_cuoi', 'bi_ngo_den_long': 'bi_den_long'}
ANNUAL = ['seedling', 'growing', 'ripe', 'product']
PERENNIAL = ['sapling', 'grown', 'fruiting', 'resting', 'product']


def alpha_box(img, margin=0):
    box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return None
    l, t, r, b = box
    return (max(l - margin, 0), max(t - margin, 0), min(r + margin, img.width), min(b + margin, img.height))


def cut(sheet, key, force):
    img = Image.open(sheet).convert('RGBA')
    wide = key in PERENNIAL_KEYS
    key = ALIAS.get(key, key)
    stages, cols = (PERENNIAL, 3) if wide else (ANNUAL, 2)
    cw, ch = img.width // cols, img.height // 2
    cells = {}
    for i, st in enumerate(stages):
        c, r = i % cols, i // cols
        cells[st] = clear_background(img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)))
    plants = [s for s in stages if s != 'product']
    boxes = [alpha_box(cells[s]) for s in plants]
    boxes = [b for b in boxes if b]
    if not boxes:
        print(key, ': nothing found in the plant cells')
        return 0
    pad = int(cw * 0.02)
    union = (max(min(b[0] for b in boxes) - pad, 0), max(min(b[1] for b in boxes) - pad, 0),
             min(max(b[2] for b in boxes) + pad, cw), min(max(b[3] for b in boxes) + pad, ch))
    written = 0
    for st in stages:
        out = os.path.join(ROOT, f'{key}_{st}.png')
        if os.path.exists(out) and not force:
            print('skip (exists):', os.path.basename(out))
            continue
        pic = cells[st]
        if st == 'product':
            box = alpha_box(pic, pad)
            pic = pic.crop(box) if box else pic
        else:
            pic = pic.crop(union)
        pic.save(out)
        written += 1
    return written


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    total = 0
    found = []
    for d in (ROOT, SHEETS):
        if os.path.isdir(d):
            found += [(f, os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith('_sheet.png')]
    for f, path in found:
        key = f[:-len('_sheet.png')]
        if args and key not in args:
            continue
        n = cut(path, key, force)
        print(key, ':', n, 'pictures written')
        total += n
    if total:
        print('Next: python3 scripts/farm_assets.py, then add the crop key to CROPS_WITH_ART in anylearn_v2/src/lib/farm/art.ts')


if __name__ == '__main__':
    sys.exit(main())
