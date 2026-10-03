package com.anylearn.backend.service;

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

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (accessKey.isBlank() || secretKey.isBlank() || bucket.isBlank()) {
            throw new RuntimeException("AWS S3 chưa được cấu hình");
        }

        String ext = getExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + "." + ext;

        S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3.putObject(request, RequestBody.fromBytes(file.getBytes()));
        s3.close();

        String baseUrl = cdnUrl.isBlank()
                ? "https://" + bucket + ".s3." + region + ".amazonaws.com"
                : cdnUrl.replaceAll("/+$", ""); // strip trailing slash

        log.info("[S3] Uploaded: {}/{}", baseUrl, key);
        return baseUrl + "/" + key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
