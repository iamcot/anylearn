package com.anylearn.backend.service;

import com.anylearn.backend.service.media.ImageCompressor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class S3Service {

    @Value("${aws.s3.accessKey:}")
    private String accessKey;

    @Value("${aws.s3.secretKey:}")
    private String secretKey;

    @Value("${aws.s3.region:ap-southeast-1}")
    private String region;

    @Value("${aws.s3.bucket:}")
    private String bucket;

    @Value("${aws.s3.cdnUrl:}")
    private String cdnUrl;

    /** True for an address of a file we stored ourselves, so a review cannot point at someone else's site. */
    public boolean isOwnUrl(String url) {
        if (url == null || url.isBlank()) return false;
        return url.startsWith(publicBaseUrl() + "/");
    }

    private String publicBaseUrl() {
        return cdnUrl.isBlank() ? "https://" + bucket + ".s3." + region + ".amazonaws.com" : cdnUrl.replaceAll("/+$", "");
    }

    /** Longest side of a stored photo; avatars use {@link #AVATAR_EDGE}. */
    public static final int DEFAULT_EDGE = 1080;
    public static final int AVATAR_EDGE = 720;
    /** Original files are accepted up to this size, then shrunk before they go to S3. */
    public static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return uploadImage(file, folder, DEFAULT_EDGE);
    }

    public String uploadImage(MultipartFile file, String folder, int maxEdge) throws IOException {
        if (accessKey.isBlank() || secretKey.isBlank() || bucket.isBlank()) {
            throw new RuntimeException("AWS S3 chưa được cấu hình");
        }

        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new IllegalArgumentException("Ảnh quá lớn, tối đa 10MB");
        }
        ImageCompressor.Result image = ImageCompressor.compress(
                file.getBytes(), file.getContentType(), getExtension(file.getOriginalFilename()), maxEdge);
        String key = folder + "/" + UUID.randomUUID() + "." + image.extension();

        S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(image.contentType())
                .build();

        s3.putObject(request, RequestBody.fromBytes(image.bytes()));
        s3.close();

        String baseUrl = publicBaseUrl();

        log.info("[S3] Uploaded: {}/{} ({} KB -> {} KB)", baseUrl, key, file.getSize() / 1024, image.bytes().length / 1024);
        return baseUrl + "/" + key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
