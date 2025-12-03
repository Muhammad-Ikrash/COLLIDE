import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.scss'
})
export class ChatSidebar implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage = '';
  isConnected = false;
  currentUserId: number | null = null;
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.chatService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
        // Update currentUserId when connected
        if (connected) {
          this.currentUserId = this.chatService.getCurrentUserId();
          console.log('Chat connected, currentUserId:', this.currentUserId);
        }
      })
    );

    // Mark messages as read when component is visible
    this.chatService.markAsRead();
    this.currentUserId = this.chatService.getCurrentUserId();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.setChatClosed();
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString();
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    
    const currentDate = new Date(this.messages[index].timestamp).toDateString();
    const prevDate = new Date(this.messages[index - 1].timestamp).toDateString();
    
    return currentDate !== prevDate;
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
