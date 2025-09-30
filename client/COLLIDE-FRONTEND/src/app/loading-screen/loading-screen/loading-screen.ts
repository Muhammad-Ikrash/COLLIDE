import { Component, inject } from '@angular/core';
import { ThemingService } from '../../core/services/theming.service';

@Component({
  selector: 'app-loading-screen',
  imports: [],
  templateUrl: './loading-screen.html',
  styleUrl: './loading-screen.scss'
})
export class LoadingScreen {
  protected readonly themingService = inject(ThemingService);

  // Example method to toggle theme (you can remove this later)
  protected toggleTheme() {
    this.themingService.toggleTheme();
  }
}
