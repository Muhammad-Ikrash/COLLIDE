package server_springboot;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.cdimascio.dotenv.Dotenv;


@SpringBootApplication
@org.springframework.context.annotation.ComponentScan(basePackages = {
	"server_springboot",
	"Controllers",
	"Services",
	"Repositories",
	"Utils",
	"Filters",
	"Config",
	"DTOs"
})
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "Repositories")
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = "Entities")
@RestController
public class ServerSpringbootApplication {

	public static void main(String[] args) {

		// Load .env if present, but don't fail startup if it's missing (useful for local dev)
		try {
			Dotenv dotenv = Dotenv.load();
			String dbPooler = dotenv.get("DB_POOLER");
			if (dbPooler != null) {
				System.setProperty("DB_POOLER", dbPooler);
			}
		} catch (Exception ex) {
			// .env not present or failed to load - continue without it
			System.out.println("Warning: .env not found or could not be loaded; continuing without it.");
		}

		SpringApplication.run(ServerSpringbootApplication.class, args);
	}

	@GetMapping("/api/hello")
	public String hello() {
		return "Hello, World!";
	}

}
