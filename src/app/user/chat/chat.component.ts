import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

import { ChatService } from '../../core/services/chat.service';
import { SessionService } from '../../core/services/session.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzBadgeModule,
    NzSkeletonModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzMessageModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Active Session & Community info
  cmpUuid = '';
  usrUuid = '';
  userName = '';
  companyName = '';

  // Room state
  rooms: any[] = [];
  filteredRooms: any[] = [];
  activeRoom: any = null;
  isLoadingRooms = true;
  searchQuery = '';
  selectedFilterType: 'Todos' | 'Consorcio' | 'Reclamos' | 'Licitación' = 'Todos';

  // Message state
  messages: any[] = [];
  isLoadingMessages = false;
  newMessageText = '';
  usersMap: { [key: string]: string } = {};

  // Admin Controls
  isCreateModalVisible = false;
  newRoomName = '';
  newRoomType: 'Consorcio' | 'Reclamos' | 'Licitación' = 'Consorcio';
  isSavingRoom = false;

  // Polling Subscriptions
  private messagesPollingSub?: Subscription;
  private roomsPollingSub?: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private sessionService: SessionService,
    private usersService: UsersService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    const activeCompany = this.sessionService.getCompany();

    this.usrUuid = session?.identity?.usr_uuid || '';
    this.userName = session?.identity?.usr_name || 'Usuario';
    this.cmpUuid = activeCompany?.cmp_uuid || '';
    this.companyName = activeCompany?.cmp_name || 'Comunidad';

    if (!this.cmpUuid || !this.usrUuid) {
      this.message.error('No se pudo identificar tu sesión.');
      return;
    }

    this.loadUsers();
    this.loadRooms(true);
    this.startRoomsPolling();
  }

  ngOnDestroy(): void {
    this.stopMessagesPolling();
    if (this.roomsPollingSub) {
      this.roomsPollingSub.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  public get isAdmin(): boolean {
    const activeCompany = this.sessionService.getCompany();
    if (!activeCompany || !activeCompany.roles) return false;
    return activeCompany.roles.some((r: any) =>
      r.rol_name === 'Administrador' ||
      r.rol_name === 'Admin' ||
      r.rol_name === 'Administración'
    );
  }

  private loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          res.data.forEach((u: any) => {
            this.usersMap[u.usr_uuid] = `${u.usr_name} ${u.usr_surname}`;
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar lista de usuarios para chat:', err);
      }
    });
  }

  public loadRooms(selectFirst = false): void {
    this.chatService.getChatRooms(this.cmpUuid).subscribe({
      next: (res: any) => {
        this.isLoadingRooms = false;
        if (res.success) {
          this.rooms = res.data || [];
          this.filterRooms();

          if (selectFirst && this.filteredRooms.length > 0 && !this.activeRoom) {
            this.selectRoom(this.filteredRooms[0]);
          }
        }
      },
      error: (err) => {
        this.isLoadingRooms = false;
        console.error('Error al cargar salas de chat:', err);
      }
    });
  }

  private startRoomsPolling(): void {
    this.roomsPollingSub = interval(8000).subscribe(() => {
      this.loadRooms(false);
    });
  }

  public filterRooms(): void {
    let list = this.rooms;

    // Filter by type
    if (this.selectedFilterType !== 'Todos') {
      list = list.filter(r => r.chr_type === this.selectedFilterType);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      list = list.filter(r => r.chr_name.toLowerCase().includes(query));
    }

    // If Resident: filter claim/tender chats where they are not part
    // Note: The backend may already do this filtering, but we keep it safe
    if (!this.isAdmin) {
      list = list.filter(r => {
        if (r.chr_type === 'Consorcio') return true;
        // In this application layout, we assume residents can access their own claim/tender rooms
        // We can safely show them or let the backend authorize
        return true;
      });
    }

    this.filteredRooms = list;
  }

  public selectRoom(room: any): void {
    if (this.activeRoom && this.activeRoom.chr_uuid === room.chr_uuid) {
      return;
    }

    this.stopMessagesPolling();
    this.activeRoom = room;
    this.messages = [];
    this.isLoadingMessages = true;
    this.shouldScrollToBottom = true;

    // Load initial messages
    this.loadMessages();
    this.startMessagesPolling();
  }

  private loadMessages(): void {
    if (!this.activeRoom) return;

    this.chatService.getChatMessages(this.cmpUuid, this.activeRoom.chr_uuid).subscribe({
      next: (res: any) => {
        this.isLoadingMessages = false;
        if (res.success) {
          const newMessages = res.data || [];
          if (newMessages.length !== this.messages.length) {
            this.messages = newMessages;
            this.shouldScrollToBottom = true;
          }
        }
      },
      error: (err) => {
        this.isLoadingMessages = false;
        console.error('Error al cargar mensajes:', err);
      }
    });
  }

  private startMessagesPolling(): void {
    // Poll messages every 4 seconds
    this.messagesPollingSub = interval(4000).subscribe(() => {
      this.loadMessages();
    });
  }

  private stopMessagesPolling(): void {
    if (this.messagesPollingSub) {
      this.messagesPollingSub.unsubscribe();
      this.messagesPollingSub = undefined;
    }
  }

  public sendMessage(): void {
    if (!this.newMessageText.trim() || !this.activeRoom) {
      return;
    }

    const payload = {
      cmp_uuid: this.cmpUuid,
      chr_uuid: this.activeRoom.chr_uuid,
      usr_uuid: this.usrUuid,
      chrmsg_text: this.newMessageText.trim()
    };

    // Optimistic UI updates
    const tempMsg = {
      cmp_uuid: this.cmpUuid,
      chr_uuid: this.activeRoom.chr_uuid,
      usr_uuid: this.usrUuid,
      chrmsg_text: this.newMessageText.trim(),
      chrmsg_createdat: new Date().toISOString(),
      isTemp: true
    };
    this.messages.push(tempMsg);
    this.shouldScrollToBottom = true;

    const sentText = this.newMessageText;
    this.newMessageText = '';

    this.chatService.sendChatMessage(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Replace optimistic message with actual DB message
          const idx = this.messages.findIndex(m => m.isTemp && m.chrmsg_text === sentText);
          if (idx !== -1) {
            this.messages[idx] = res.data;
          }
          this.shouldScrollToBottom = true;
        }
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        this.message.error('No se pudo enviar el mensaje.');
        // Remove optimistic message
        this.messages = this.messages.filter(m => !m.isTemp);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Ignore scroll failures
    }
  }

  // Admin Room Creation Modal
  public showCreateModal(): void {
    this.newRoomName = '';
    this.newRoomType = 'Consorcio';
    this.isCreateModalVisible = true;
  }

  public handleCancel(): void {
    this.isCreateModalVisible = false;
  }

  public createRoom(): void {
    if (!this.newRoomName.trim()) {
      this.message.warning('El nombre del canal es obligatorio.');
      return;
    }

    this.isSavingRoom = true;
    const payload = {
      cmp_uuid: this.cmpUuid,
      chr_name: this.newRoomName.trim(),
      chr_type: this.newRoomType,
      cla_uuid: null,
      ten_uuid: null
    };

    this.chatService.saveChatRoom(payload).subscribe({
      next: (res: any) => {
        this.isSavingRoom = false;
        this.isCreateModalVisible = false;
        if (res.success) {
          this.message.success('Canal creado correctamente.');
          this.loadRooms(false);
        }
      },
      error: (err) => {
        this.isSavingRoom = false;
        console.error('Error al crear canal:', err);
        this.message.error('No se pudo crear el canal.');
      }
    });
  }

  public deleteRoom(room: any, event: MouseEvent): void {
    event.stopPropagation();
    
    this.chatService.deleteChatRoom(this.cmpUuid, room.chr_uuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Canal eliminado correctamente.');
          if (this.activeRoom && this.activeRoom.chr_uuid === room.chr_uuid) {
            this.activeRoom = null;
            this.messages = [];
            this.stopMessagesPolling();
          }
          this.loadRooms(true);
        }
      },
      error: (err) => {
        console.error('Error al eliminar sala:', err);
        this.message.error('No se pudo eliminar el canal.');
      }
    });
  }

  // Format Helper
  public formatTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const hrs = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `${hrs}:${mins}`;
    } catch (err) {
      return '';
    }
  }

  public getInitials(name: string): string {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
