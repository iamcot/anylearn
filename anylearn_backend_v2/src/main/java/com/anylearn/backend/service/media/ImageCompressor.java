package com.anylearn.backend.service.media;

import net.coobird.thumbnailator.Thumbnails;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Shrinks an uploaded photo before it goes to S3 (pure, no Spring). A photo whose long side is over
 * {@code maxEdge} is scaled down and saved again as JPEG (PNG with transparency stays PNG); the camera's
 * rotation is applied. Small light files, GIF and formats Java cannot read (webp, heic, svg) go through untouched.
 */
public final class ImageCompressor {

    public static final int MAX_PIXELS = 60_000_000;
    /** Below this size an image that already fits is kept as it is. */
    static final int KEEP_BELOW_BYTES = 400_000;
    static final float JPEG_QUALITY = 0.82f;

    public record Result(byte[] bytes, String contentType, String extension, boolean recompressed) {}

    private ImageCompressor() {}

    public static Result compress(byte[] data, String contentType, String extension, int maxEdge) throws IOException {
        return compress(data, contentType, extension, maxEdge, MAX_PIXELS);
    }

    public static Result compress(byte[] data, String contentType, String extension, int maxEdge, long maxPixels) throws IOException {
        Result untouched = new Result(data, contentType, extension, false);
        int width, height;
        String format;
        boolean alpha;
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(data))) {
            Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
            if (readers == null || !readers.hasNext()) return untouched;
            ImageReader reader = readers.next();
            try {
                reader.setInput(in, true, true);
                format = reader.getFormatName().toLowerCase();
                width = reader.getWidth(0);
                height = reader.getHeight(0);
                var raw = reader.getRawImageType(0);
                alpha = raw == null ? "png".equals(format) : raw.getColorModel().hasAlpha();
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            return untouched;
        }
        if ("gif".equals(format)) return untouched;
        if ((long) width * height > maxPixels) {
            throw new IllegalArgumentException("Ảnh có độ phân giải quá lớn, vui lòng chọn ảnh nhỏ hơn");
        }
        int longSide = Math.max(width, height);
        if (longSide <= maxEdge && data.length <= KEEP_BELOW_BYTES) return untouched;

        boolean keepPng = "png".equals(format) && alpha;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        var builder = Thumbnails.of(new ByteArrayInputStream(data));
        if (longSide > maxEdge) builder.size(maxEdge, maxEdge); else builder.scale(1.0);
        builder.outputFormat(keepPng ? "png" : "jpg");
        if (!keepPng) builder.outputQuality(JPEG_QUALITY);
        builder.toOutputStream(out);
        byte[] result = out.toByteArray();
        // an already well compressed file can grow when saved again
        if (longSide <= maxEdge && result.length >= data.length) return untouched;
        return keepPng ? new Result(result, "image/png", "png", true) : new Result(result, "image/jpeg", "jpg", true);
    }
}
