package com.anydrop.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AnyDropApplication {

    public static void main(String[] args) {
        SpringApplication.run(AnyDropApplication.class, args); // No headless check here as it might be needed for
                                                               // Robot? Actually Robot needs headless=false.
        // On a server, Robot will fail if there is no display.
        // We will set this property to false explicitly to allow Robot if a display is
        // present,
        // though Spring Boot usually defaults to headless=true for webapps.
        System.setProperty("java.awt.headless", "false");
    }

}
