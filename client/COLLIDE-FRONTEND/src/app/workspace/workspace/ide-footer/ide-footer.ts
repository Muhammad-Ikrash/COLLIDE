
import { Component, OnDestroy } from '@angular/core';
import { CursorService, CursorPos } from '../../../core/services/cursor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ide-footer',
  imports: [],
  templateUrl: './ide-footer.html',
  styleUrl: './ide-footer.scss'
})
export class IdeFooter implements OnDestroy {
  position: CursorPos = { line: 1, column: 1 };
  private sub?: Subscription;

  constructor(private cursor: CursorService) {
    this.sub = this.cursor.pos$.subscribe(p => this.position = p);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
