package com.anylearn.backend.service.media;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageCompressorTest {

    private static byte[] encode(int w, int h, int type, String format) throws Exception {
        BufferedImage img = new BufferedImage(w, h, type);
        Graphics2D g = img.createGraphics();
        Random r = new Random(7);
        for (int i = 0; i < 400; i++) {
            g.setColor(new Color(r.nextInt(256), r.nextInt(256), r.nextInt(256)));
            g.fillRect(r.nextInt(w), r.nextInt(h), 1 + r.nextInt(w / 4 + 1), 1 + r.nextInt(h / 4 + 1));
        }
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, format, out);
        return out.toByteArray();
    }

    private static BufferedImage decode(byte[] b) throws Exception {
        return ImageIO.read(new ByteArrayInputStream(b));
    }

    @Test
    void bigPhotoIsScaledToTheLongSideAndStaysSmaller() throws Exception {
        byte[] original = encode(3000, 2000, BufferedImage.TYPE_INT_RGB, "jpg");
        var r = ImageCompressor.compress(original, "image/jpeg", "jpg", 1080);
        BufferedImage out = decode(r.bytes());
        assertThat(r.recompressed()).isTrue();
        assertThat(out.getWidth()).isEqualTo(1080);
        assertThat(out.getHeight()).isEqualTo(720);
        assertThat(r.bytes().length).isLessThan(original.length);
        assertThat(r.contentType()).isEqualTo("image/jpeg");
    }

    @Test
    void portraitPhotoUsesTheLongSideToo() throws Exception {
        var r = ImageCompressor.compress(encode(2000, 3000, BufferedImage.TYPE_INT_RGB, "jpg"), "image/jpeg", "jpg", 720);
        BufferedImage out = decode(r.bytes());
        assertThat(out.getHeight()).isEqualTo(720);
        assertThat(out.getWidth()).isEqualTo(480);
    }

    @Test
    void smallLightImageIsKeptAsItIs() throws Exception {
        byte[] original = encode(200, 200, BufferedImage.TYPE_INT_RGB, "jpg");
        var r = ImageCompressor.compress(original, "image/jpeg", "jpg", 1080);
        assertThat(r.recompressed()).isFalse();
        assertThat(r.bytes()).isSameAs(original);
    }

    @Test
    void pngWithTransparencyStaysPng() throws Exception {
        var r = ImageCompressor.compress(encode(2400, 1600, BufferedImage.TYPE_INT_ARGB, "png"), "image/png", "png", 1080);
        assertThat(r.contentType()).isEqualTo("image/png");
        assertThat(r.extension()).isEqualTo("png");
        assertThat(decode(r.bytes()).getWidth()).isEqualTo(1080);
    }

    @Test
    void opaquePngBecomesJpeg() throws Exception {
        var r = ImageCompressor.compress(encode(2400, 1600, BufferedImage.TYPE_INT_RGB, "png"), "image/png", "png", 1080);
        assertThat(r.contentType()).isEqualTo("image/jpeg");
        assertThat(r.extension()).isEqualTo("jpg");
    }

    @Test
    void unreadableBytesPassThrough() throws Exception {
        byte[] junk = "RIFFxxxxWEBPnot-really".getBytes();
        var r = ImageCompressor.compress(junk, "image/webp", "webp", 1080);
        assertThat(r.recompressed()).isFalse();
        assertThat(r.bytes()).isSameAs(junk);
        assertThat(r.extension()).isEqualTo("webp");
    }

    @Test
    void gifIsNeverTouched() throws Exception {
        byte[] gif = encode(3000, 2000, BufferedImage.TYPE_INT_RGB, "gif");
        assertThat(ImageCompressor.compress(gif, "image/gif", "gif", 1080).bytes()).isSameAs(gif);
    }

    @Test
    void tooManyPixelsAreRejectedBeforeDecoding() throws Exception {
        byte[] original = encode(3000, 2000, BufferedImage.TYPE_INT_RGB, "jpg");
        assertThatThrownBy(() -> ImageCompressor.compress(original, "image/jpeg", "jpg", 1080, 1_000_000))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
