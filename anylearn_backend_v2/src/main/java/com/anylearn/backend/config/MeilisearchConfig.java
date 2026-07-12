package com.anylearn.backend.config;

import com.meilisearch.sdk.Client;
import com.meilisearch.sdk.Config;
import com.meilisearch.sdk.exceptions.MeilisearchException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class MeilisearchConfig {

    @Value("${meilisearch.host}")
    private String host;

    @Value("${meilisearch.api-key}")
    private String apiKey;

    @Bean
    public Client meilisearchClient() {
        Client client = new Client(new Config(host, apiKey));
        setupIndex(client);
        return client;
    }

    private void setupIndex(Client client) {
        try {
            client.createIndex("items", "id");

            var index = client.index("items");

            index.updateSearchableAttributesSettings(new String[]{
                "title", "tags", "category_titles", "author_name", "short_content", "content"
            });

            index.updateFilterableAttributesSettings(new String[]{
                "status", "userStatus", "type", "subtype", "price", "categoryUrls"
            });

            index.updateSortableAttributesSettings(new String[]{
                "isHot", "boostScore", "price", "dateStart", "id"
            });

            index.updateRankingRulesSettings(new String[]{
                "sort", "words", "typo", "proximity", "attribute", "exactness"
            });

            log.info("Meilisearch index 'items' configured successfully");
        } catch (MeilisearchException e) {
            log.warn("Meilisearch not available at startup (will retry on first use): {}", e.getMessage());
        }
    }
}
