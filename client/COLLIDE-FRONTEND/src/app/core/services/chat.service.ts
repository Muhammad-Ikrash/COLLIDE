import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string | number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  content: string;
  timestamp: Date;
  projectId: number;
}

interface BackendChatMessage {
  id: number;
  projectId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  
  messages$ = this.messagesSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  isConnected$ = this.isConnectedSubject.asObservable();

  private currentProjectId: number | null = null;
  private currentUserId: number | null = null;
  private currentUserName: string = '';
  private currentUserEmail: string = '';
  private isChatOpen = false;
  
  private pollingSubscription: Subscription | null = null;
  private readonly POLL_INTERVAL = 2000; // Poll every 2 seconds

  constructor() {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('supabase_access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Connect to the chat for a specific project
   */
  connect(projectId: number, userId: number, userName: string, userEmail: string): void {
    console.log('ChatService: Connecting to chat for project', projectId, 'userId:', userId);
    
    this.currentProjectId = projectId;
    this.currentUserId = userId || 0;
    this.currentUserName = userName || 'User';
    this.currentUserEmail = userEmail || '';

    // Stop any existing polling
    this.stopPolling();

    // Connect to backend
    this.http.post<any>(
      `${this.apiUrl}/chat/connect/${projectId}`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        console.log('ChatService: Connected to backend', response);
        
        // Use the backend's user ID (from database) for accurate message ownership
        if (response.userId) {
          this.currentUserId = response.userId;
          console.log('ChatService: Using backend userId:', this.currentUserId);
        }
        if (response.userName) {
          this.currentUserName = response.userName;
        }
        
        this.isConnectedSubject.next(true);
        
        // Load initial messages from backend
        this.loadMessages();
        
        // Start polling for new messages
        this.startPolling();
      },
      error: (err) => {
        console.error('ChatService: Failed to connect', err);
        // Still mark as connected but with empty messages
        this.isConnectedSubject.next(true);
        this.messagesSubject.next([]);
        this.startPolling();
      }
    });
  }

  /**
   * Disconnect from the chat
   */
  disconnect(): void {
    this.stopPolling();
    
    if (this.currentProjectId) {
      this.http.post<any>(
        `${this.apiUrl}/chat/disconnect/${this.currentProjectId}`,
        {},
        { headers: this.getHeaders() }
      ).subscribe({
        next: () => console.log('ChatService: Disconnected'),
        error: (err) => console.error('ChatService: Error disconnecting', err)
      });
    }
    
    this.isConnectedSubject.next(false);
    this.messagesSubject.next([]);
    this.currentProjectId = null;
  }

  /**
   * Load messages from backend
   */
  private loadMessages(): void {
    if (!this.currentProjectId) return;

    this.http.get<BackendChatMessage[]>(
      `${this.apiUrl}/chat/messages/${this.currentProjectId}/recent`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (messages) => {
        const converted = this.convertMessages(messages);
        this.messagesSubject.next(converted);
      },
      error: (err) => {
        console.error('ChatService: Failed to load messages', err);
        this.messagesSubject.next([]);
      }
    });
  }

  /**
   * Start polling for new messages
   */
  private startPolling(): void {
    this.pollingSubscription = interval(this.POLL_INTERVAL).subscribe(() => {
      this.pollNewMessages();
    });
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Poll for new messages
   */
  private pollNewMessages(): void {
    if (!this.currentProjectId) return;

    this.http.get<BackendChatMessage[]>(
      `${this.apiUrl}/chat/messages/${this.currentProjectId}/recent`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (messages) => {
        const converted = this.convertMessages(messages);
        const currentMessages = this.messagesSubject.value;
        
        // Find new messages (excluding temp messages)
        const newMessages = converted.filter(
          m => !currentMessages.some(cm => cm.id === m.id || (typeof cm.id === 'string' && cm.id.startsWith('temp_')))
        );

        if (newMessages.length > 0 || converted.length !== currentMessages.filter(m => typeof m.id === 'number').length) {
          // Update with backend messages, keeping any pending temp messages
          const tempMessages = currentMessages.filter(m => typeof m.id === 'string' && m.id.startsWith('temp_'));
          this.messagesSubject.next([...converted, ...tempMessages]);

          // Count unread messages from others if chat is closed
          if (!this.isChatOpen) {
            const unreadFromOthers = newMessages.filter(
              m => m.senderId !== this.currentUserId
            ).length;
            if (unreadFromOthers > 0) {
              this.unreadCountSubject.next(
                this.unreadCountSubject.value + unreadFromOthers
              );
            }
          }
        }
      },
      error: (err) => {
        // Silent fail on polling errors
        console.debug('ChatService: Poll failed', err);
      }
    });
  }

  /**
   * Convert backend messages to frontend format
   */
  private convertMessages(messages: BackendChatMessage[]): ChatMessage[] {
    return messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      content: m.content,
      timestamp: new Date(m.timestamp),
      projectId: m.projectId
    }));
  }

  /**
   * Send a message - always sends to backend
   */
  sendMessage(content: string): void {
    if (!content.trim() || !this.currentProjectId) return;

    // Send to backend first
    this.http.post<BackendChatMessage>(
      `${this.apiUrl}/chat/send`,
      {
        projectId: this.currentProjectId,
        content: content.trim()
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (savedMessage) => {
        console.log('ChatService: Message saved to backend', savedMessage);
        // Add the saved message to the list
        const currentMessages = this.messagesSubject.value;
        const newMessage = this.convertMessages([savedMessage])[0];
        
        // Check if message already exists (from polling)
        if (!currentMessages.some(m => m.id === newMessage.id)) {
          this.messagesSubject.next([...currentMessages, newMessage]);
        }
      },
      error: (err) => {
        console.error('ChatService: Failed to send message', err);
        // Show error to user - message was NOT saved
        alert('Failed to send message. Please try again.');
      }
    });
  }

  /**
   * Mark messages as read when chat is opened
   */
  markAsRead(): void {
    this.isChatOpen = true;
    this.unreadCountSubject.next(0);
  }

  /**
   * Set chat as closed (for unread tracking)
   */
  setChatClosed(): void {
    this.isChatOpen = false;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): number | null {
    return this.currentUserId;
  }
}
