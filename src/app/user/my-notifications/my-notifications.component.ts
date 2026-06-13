import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { SessionService } from '../../core/services/session.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'app-my-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzMessageModule,
    NzPopconfirmModule
  ],
  templateUrl: './my-notifications.component.html',
  styleUrl: './my-notifications.component.scss'
})
export class MyNotificationsComponent implements OnInit {
  notifications: any[] = [];
  filteredNotifications: any[] = [];
  isLoading = false;
  filterStatus: 'all' | 'unread' | 'read' = 'all';

  usrUuid = '';
  cmpUuid = '';

  get totalCount(): number {
    return this.notifications.length;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.ntf_isread).length;
  }

  get readCount(): number {
    return this.notifications.filter(n => n.ntf_isread).length;
  }

  constructor(
    private notificationsService: NotificationsService,
    private sessionService: SessionService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.cmpUuid = session?.company?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid || '';

    if (this.usrUuid && this.cmpUuid) {
      this.loadNotifications();
    } else {
      this.message.warning('No se pudo determinar el consorcio activo o el usuario.');
    }
  }

  public loadNotifications(): void {
    this.isLoading = true;
    this.notificationsService.getNotifications(this.usrUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.notifications = res.data;
          this.applyFilter();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('Error al cargar el historial de notificaciones.');
      }
    });
  }

  public setFilter(status: 'all' | 'unread' | 'read'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.filterStatus === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.ntf_isread);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.ntf_isread);
    }
  }

  public markAsRead(ntf: any): void {
    if (ntf.ntf_isread) {
      if (ntf.ntf_actionurl) {
        this.router.navigate([ntf.ntf_actionurl]);
      }
      return;
    }

    const payload = {
      cmp_uuid: ntf.cmp_uuid,
      ntf_title: ntf.ntf_title,
      ntf_message: ntf.ntf_message,
      ntf_type: ntf.ntf_type,
      ntf_isread: true
    };

    this.notificationsService.updateNotification(this.usrUuid, ntf.ntf_uuid, payload).subscribe({
      next: () => {
        ntf.ntf_isread = true;
        this.applyFilter();
        this.message.success('Notificación marcada como leída.');
        if (ntf.ntf_actionurl) {
          this.router.navigate([ntf.ntf_actionurl]);
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('Error al actualizar la notificación.');
      }
    });
  }

  public toggleStatus(ntf: any, event: MouseEvent): void {
    event.stopPropagation(); // Evitar abrir la acción de la notificación
    const payload = {
      cmp_uuid: ntf.cmp_uuid,
      ntf_title: ntf.ntf_title,
      ntf_message: ntf.ntf_message,
      ntf_type: ntf.ntf_type,
      ntf_isread: !ntf.ntf_isread
    };

    this.notificationsService.updateNotification(this.usrUuid, ntf.ntf_uuid, payload).subscribe({
      next: () => {
        ntf.ntf_isread = !ntf.ntf_isread;
        this.applyFilter();
        this.message.success(ntf.ntf_isread ? 'Marcada como leída.' : 'Marcada como no leída.');
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('Error al actualizar la notificación.');
      }
    });
  }

  public deleteNotification(ntf: any): void {
    this.notificationsService.deleteNotification(this.usrUuid, ntf.ntf_uuid).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.ntf_uuid !== ntf.ntf_uuid);
        this.applyFilter();
        this.message.success('Notificación eliminada con éxito.');
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('Error al eliminar la notificación.');
      }
    });
  }

  public markAllAsRead(): void {
    const unread = this.notifications.filter(n => !n.ntf_isread);
    if (unread.length === 0) return;

    let successCount = 0;
    unread.forEach(ntf => {
      const payload = {
        cmp_uuid: ntf.cmp_uuid,
        ntf_title: ntf.ntf_title,
        ntf_message: ntf.ntf_message,
        ntf_type: ntf.ntf_type,
        ntf_isread: true
      };
      this.notificationsService.updateNotification(this.usrUuid, ntf.ntf_uuid, payload).subscribe({
        next: () => {
          ntf.ntf_isread = true;
          successCount++;
          if (successCount === unread.length) {
            this.applyFilter();
            this.message.success('Todas las notificaciones marcadas como leídas.');
          }
        }
      });
    });
  }
}

