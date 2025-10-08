package server_springboot;



import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.cdimascio.dotenv.Dotenv;


@SpringBootApplication
@EntityScan(basePackages = {"Entities"})
@EnableJpaRepositories(basePackages = {"Repositories"})
@RestController
public class ServerSpringbootApplication {

	static void main(String[] args) {

		Dotenv dotenv = Dotenv.load();
		System.setProperty("DB_POOLER", dotenv.get("DB_POOLER"));

		SpringApplication.run(ServerSpringbootApplication.class, args);
	}

	@GetMapping("/api/hello")
	public String hello() {
		return "Hello, World!";
	}

}
