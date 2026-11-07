#!/usr/bin/env bash
# Generates the responsive variants the 415 pages use: AVIF and WebP at 600,
# 900, 1200, 1800 and 2400 wide for every work image, from the 2400-wide JPEG
# (or the native-size JPEG for the 16:9 film stills). The JPEG fallback keeps
# only the existing 1200/2400 files. Idempotent: skips outputs newer than the
# source. Needs ffmpeg (libaom-av1) and cwebp (brew install ffmpeg webp).
set -euo pipefail
cd "$(dirname "$0")/../assets/img/work"
WIDTHS="600 900 1200 1800 2400"
made=0; skipped=0
for src in *-2400.jpg film-shell.jpg film-tiburon.jpg film-loop-poster.jpg; do
  [ -f "$src" ] || continue
  base="${src%-2400.jpg}"; base="${base%.jpg}"
  native=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  for w in $WIDTHS; do
    [ "$w" -gt "$native" ] && continue
    for fmt in avif webp; do
      out="$base-$w.$fmt"
      if [ -f "$out" ] && [ "$out" -nt "$src" ]; then skipped=$((skipped+1)); continue; fi
      if [ "$fmt" = avif ]; then
        ffmpeg -v error -y -i "$src" -vf "scale=$w:-2:flags=lanczos" -c:v libaom-av1 -still-picture 1 -crf 30 -b:v 0 -cpu-used 6 -pix_fmt yuv420p "$out"
      else
        ffmpeg -v error -y -i "$src" -vf "scale=$w:-2:flags=lanczos" -f image2 -c:v mjpeg -q:v 2 /tmp/build-images-tmp.jpg
        cwebp -quiet -q 78 -m 6 /tmp/build-images-tmp.jpg -o "$out"
      fi
      made=$((made+1))
    done
  done
done
rm -f /tmp/build-images-tmp.jpg
echo "made $made, skipped $skipped"
