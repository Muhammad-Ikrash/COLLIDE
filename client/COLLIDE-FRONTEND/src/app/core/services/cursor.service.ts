import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CursorPos = { line: number; column: number };

@Injectable({ providedIn: 'root' })
export class CursorService {
  private posSubject = new BehaviorSubject<CursorPos>({ line: 1, column: 1 });
  pos$ = this.posSubject.asObservable();

  setPosition(line: number, column: number) {
    this.posSubject.next({ line, column });
  }
}
