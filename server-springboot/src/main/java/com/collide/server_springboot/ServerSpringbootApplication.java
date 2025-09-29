package com.collide.server_springboot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class ServerSpringbootApplication {

	static void main(String[] args) {
		SpringApplication.run(ServerSpringbootApplication.class, args);
	}

	@GetMapping("/api/hello")
	public String hello() {
		return "Hello, World!";
	}

}
