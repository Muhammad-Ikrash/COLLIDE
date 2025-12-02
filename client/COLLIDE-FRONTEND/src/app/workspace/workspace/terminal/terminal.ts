import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class TerminalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('terminal') terminalRef!: ElementRef;

  @Input() terminalPath! : string | null;  // to ensure that the temrinal is loaded in the folder 
  private term!: Terminal;
  private fitAddon!: FitAddon;

  ngAfterViewInit() {
    this.term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14
    });

    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalRef.nativeElement);

    setTimeout(() => this.fitAddon.fit(), 100);

    window.addEventListener('resize', this.onResize);

    const api = (window as any).electronAPI;
    if (!api) {
      this.term.write('Electron API not available.\r\n');
      return;
    }

    api.startTerminal(this.terminalPath);

    api.onTerminalData((data: string) => {
      this.term.write(data); 
    });

    this.term.onData((data) => {
      this.term.write(data);
      console.log(data);
      api.sendTerminalInput(data); 
    });

    api.onTerminalKill(() => {
      this.term.dispose();
    });
  }

  onResize = () => {
    if (this.fitAddon) this.fitAddon.fit();
  };

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);

    const api = (window as any).electronAPI;
    if (api) api.killTerminal();

    if (this.term) this.term.dispose();
  }
}
