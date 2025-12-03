import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription, IFrame } from '@stomp/stompjs';

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
  private wsUrl = environment.apiUrl.replace('/api', ''); // Base URL without /api

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
  
  // WebSocket/STOMP client
  private stompClient: Client | null = null;
  private messageSubscription: StompSubscription | null = null;
  private userSubscription: StompSubscription | null = null;

  constructor() {}

  private getToken(): string {
    return localStorage.getItem('supabase_access_token') || '';
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Connect to the chat for a specific project using WebSocket
   */
  connect(projectId: number, userId: number, userName: string, userEmail: string): void {
    console.log('ChatService: Connecting to WebSocket chat for project', projectId);
    
    this.currentProjectId = projectId;
    this.currentUserId = userId || 0;
    this.currentUserName = userName || 'User';
    this.currentUserEmail = userEmail || '';

    // Disconnect any existing connection
    this.disconnectWebSocket();

    // First, connect via REST to get user info and validate access
    this.http.post<any>(
      `${this.apiUrl}/chat/connect/${projectId}`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        console.log('ChatService: REST connect successful', response);
        
        // Use the backend's user ID
        if (response.userId) {
          this.currentUserId = response.userId;
        }
        if (response.userName) {
          this.currentUserName = response.userName;
        }
        
        // Load initial messages
        this.loadMessages();
        
        // Now connect WebSocket for real-time messaging
        this.connectWebSocket();
      },
      error: (err) => {
        console.error('ChatService: REST connect failed', err);
        // Still try to load messages and connect
        this.loadMessages();
        this.connectWebSocket();
      }
    });
  }

  /**
   * Connect to WebSocket using STOMP
   */
  private connectWebSocket(): void {
    const wsEndpoint = `${this.wsUrl}/ws`;
    console.log('ChatService: Connecting to WebSocket at', wsEndpoint);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str: string) => {
        console.debug('STOMP:', str);
      }
    });

    this.stompClient.onConnect = (frame: IFrame) => {
      console.log('ChatService: WebSocket connected', frame);
      this.isConnectedSubject.next(true);
      
      // Subscribe to messages for this project
      this.subscribeToMessages();
      
      // Send join message
      this.sendJoinMessage();
    };

    this.stompClient.onStompError = (frame: IFrame) => {
      console.error('ChatService: STOMP error', frame.headers['message'], frame.body);
    };

    this.stompClient.onWebSocketError = (event: Event) => {
      console.error('ChatService: WebSocket error', event);
    };

    this.stompClient.onDisconnect = () => {
      console.log('ChatService: WebSocket disconnected');
      this.isConnectedSubject.next(false);
    };

    this.stompClient.activate();
  }

  /**
   * Subscribe to messages for the current project
   */
  private subscribeToMessages(): void {
    if (!this.stompClient || !this.currentProjectId) return;

    // Subscribe to chat messages
    this.messageSubscription = this.stompClient.subscribe(
      `/topic/chat/${this.currentProjectId}`,
      (message: IMessage) => {
        this.handleIncomingMessage(message);
      }
    );

    // Subscribe to user events (join/leave)
    this.userSubscription = this.stompClient.subscribe(
      `/topic/chat/${this.currentProjectId}/users`,
      (message: IMessage) => {
        console.log('ChatService: User event', message.body);
      }
    );

    console.log('ChatService: Subscribed to /topic/chat/' + this.currentProjectId);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleIncomingMessage(message: IMessage): void {
    try {
      const chatMessage: BackendChatMessage = JSON.parse(message.body);
      console.log('ChatService: Received message via WebSocket', chatMessage);

      const converted = this.convertMessage(chatMessage);
      const currentMessages = this.messagesSubject.value;

      // Check if message already exists
      if (!currentMessages.some(m => m.id === converted.id)) {
        this.messagesSubject.next([...currentMessages, converted]);

        // Update unread count if chat is closed and message is from someone else
        if (!this.isChatOpen && converted.senderId !== this.currentUserId) {
          this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        }
      }
    } catch (e) {
      console.error('ChatService: Error parsing incoming message', e);
    }
  }

  /**
   * Send join message via WebSocket
   */
  private sendJoinMessage(): void {
    if (!this.stompClient || !this.currentProjectId) return;

    this.stompClient.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({
        projectId: this.currentProjectId,
        content: '',
        senderToken: this.getToken()
      })
    });
  }

  /**
   * Send leave message via WebSocket
   */
  private sendLeaveMessage(): void {
    if (!this.stompClient || !this.currentProjectId) return;

    this.stompClient.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({
        projectId: this.currentProjectId,
        content: '',
        senderToken: this.getToken()
      })
    });
  }

  /**
   * Disconnect WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = null;
    }
    if (this.stompClient) {
      this.sendLeaveMessage();
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  /**
   * Disconnect from the chat
   */
  disconnect(): void {
    this.disconnectWebSocket();
    
    if (this.currentProjectId) {
      this.http.post<any>(
        `${this.apiUrl}/chat/disconnect/${this.currentProjectId}`,
        {},
        { headers: this.getHeaders() }
      ).subscribe({
        next: () => console.log('ChatService: REST disconnect successful'),
        error: (err) => console.error('ChatService: REST disconnect error', err)
      });
    }
    
    this.isConnectedSubject.next(false);
    this.messagesSubject.next([]);
    this.currentProjectId = null;
  }

  /**
   * Load initial messages from backend via REST
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
        console.log('ChatService: Loaded', converted.length, 'initial messages');
      },
      error: (err) => {
        console.error('ChatService: Failed to load messages', err);
        this.messagesSubject.next([]);
      }
    });
  }

  /**
   * Convert single backend message to frontend format
   */
  private convertMessage(m: BackendChatMessage): ChatMessage {
    return {
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      content: m.content,
      timestamp: new Date(m.timestamp),
      projectId: m.projectId
    };
  }

  /**
   * Convert backend messages to frontend format
   */
  private convertMessages(messages: BackendChatMessage[]): ChatMessage[] {
    return messages.map(m => this.convertMessage(m));
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(content: string): void {
    if (!content.trim() || !this.currentProjectId) return;

    if (this.stompClient && this.stompClient.connected) {
      // Send via WebSocket
      console.log('ChatService: Sending message via WebSocket');
      this.stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          projectId: this.currentProjectId,
          content: content.trim(),
          senderToken: this.getToken()
        })
      });
    } else {
      // Fallback to REST API if WebSocket is not connected
      console.log('ChatService: WebSocket not connected, falling back to REST');
      this.sendMessageViaRest(content);
    }
  }

  /**
   * Fallback: Send message via REST API
   */
  private sendMessageViaRest(content: string): void {
    this.http.post<BackendChatMessage>(
      `${this.apiUrl}/chat/send`,
      {
        projectId: this.currentProjectId,
        content: content.trim()
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (savedMessage) => {
        console.log('ChatService: Message saved via REST', savedMessage);
        const currentMessages = this.messagesSubject.value;
        const newMessage = this.convertMessage(savedMessage);
        
        if (!currentMessages.some(m => m.id === newMessage.id)) {
          this.messagesSubject.next([...currentMessages, newMessage]);
        }
      },
      error: (err) => {
        console.error('ChatService: Failed to send message', err);
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
