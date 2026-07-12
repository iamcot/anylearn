package com.anylearn.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AnyLearnBackendV2Application {

	public static void main(String[] args) {
		SpringApplication.run(AnyLearnBackendV2Application.class, args);
	}

}
