package com.anylearn.backend.service.explore;

import com.anylearn.backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Deletes the files a post no longer uses (a deleted post, a replaced clip, photo or poster): the video on our Bunny
 * library and photos in the `explore/` folder of our S3 bucket. A file another post still points at is kept, and links
 * that are not ours (YouTube, other sites) are never touched. Runs after the commit, failures are only logged.
 */
@Component
@RequiredArgsConstructor
public class ExploreMediaCleaner {

    static final String S3_FOLDER = "explore";

    private final JdbcTemplate jdbc;
    private final BunnyStreamClient bunny;
    private final S3Service s3;

    @Async
    public void deleteUnused(Collection<String> urls) {
        for (String url : urls) {
            if (url == null || url.isBlank()) continue;
            Long users = jdbc.queryForObject("SELECT COUNT(*) FROM explore_posts WHERE media_url = ? OR poster_url = ?", Long.class, url, url);
            if (users != null && users > 0) continue;
            bunny.deleteVideoOf(url);
            s3.deleteOwnFile(url, S3_FOLDER);
        }
    }
}
