import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemingService } from './core/services/theming.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('COLLIDE-FRONTEND');
  private readonly themingService = inject(ThemingService);

  ngOnInit() {
    // Initialize theming service - it will automatically apply the stored theme
    // or default to dark theme if no preference is found
    console.log('Current theme:', this.themingService.getCurrentTheme());
  }
}
