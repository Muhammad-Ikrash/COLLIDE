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
			// Try loading from parent directory (project root) first, then current directory
			Dotenv dotenv = Dotenv.configure()
				.directory("../")  // Look in parent directory (e.g., when running from server-springboot/)
				.ignoreIfMissing()
				.load();
			
			// If no .env found in parent, try current directory
			if (dotenv.get("DB_POOLER") == null) {
				dotenv = Dotenv.configure()
					.ignoreIfMissing()
					.load();
			}
			
			// Set all database-related environment variables as system properties
			String[] envVars = {"DB_POOLER", "DB_DRIVER", "HIBERNATE_DIALECT", "DB_USERNAME", "DB_PASSWORD"};
			for (String var : envVars) {
				String value = dotenv.get(var);
				if (value != null) {
					System.setProperty(var, value);
				}
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
