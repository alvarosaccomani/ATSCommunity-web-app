import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommonModule } from '@angular/common';
import { filter, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SessionService } from './core/services/session.service';
import { UserRolesCompanyService } from './core/services/user-roles-company.service';
import { NotificationsService } from './core/services/notifications.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    RouterLink, 
    RouterOutlet, 
    NzIconModule, 
    NzLayoutModule, 
    NzMenuModule,
    NzButtonModule,
    NzDropDownModule,
    NzBadgeModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isAuthRoute = false;
  isMobile = false;
  public userRolesCompany: any[] = [];
  public activeCompany: any = null;
  public notifications: any[] = [];
  public unreadCount = 0;
  private pollingSub?: Subscription;

  constructor(
    private _sessionService: SessionService,
    private _userRolesCompanyService: UserRolesCompanyService,
    private _router: Router,
    private notificationsService: NotificationsService
  ) {
    this.isAuthRoute = window.location.pathname.startsWith('/auth');
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAuthRoute = event.urlAfterRedirects.startsWith('/auth') || event.url.startsWith('/auth');
      this.checkMobile();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    if (typeof window !== 'undefined') {
      const mobileStatus = window.innerWidth < 768;
      if (this.isMobile !== mobileStatus) {
        this.isMobile = mobileStatus;
      }
      if (this.isMobile) {
        this.isCollapsed = true;
      }
    }
  }

  public get isAdmin(): boolean {
    if (!this.activeCompany || !this.activeCompany.roles) return false;
    return this.activeCompany.roles.some((r: any) =>
      r.rol_name === 'Administrador' ||
      r.rol_name === 'Admin' ||
      r.rol_name === 'Administración'
    );
  }

  ngOnInit(): void {
    this.checkMobile();

    const identity = this._sessionService.getIdentity();
    const currentSession = this._sessionService.getCurrentSession() as any;
    this.activeCompany = currentSession?.company || null;

    if (identity) {
      this.startNotificationPolling();
      this._userRolesCompanyService.getUserRolesCompanyByUser(identity.usr_uuid!)
        .subscribe((response: any) => {
          this.userRolesCompany = this.groupByCompany(response.data);

          if (!this.activeCompany && this.userRolesCompany.length > 0) {
            this.activeCompany = this.userRolesCompany[0];
            this._sessionService.setCompany(JSON.stringify(this.activeCompany));
            this.startNotificationPolling();
          }
        });
    }
  }

  public groupByCompany(data: any[]): any[] {
    const grouped = new Map();
    data.forEach((item) => {
      const cmpUuid = item.cmp.cmp_uuid;
      if (!grouped.has(cmpUuid)) {
        grouped.set(cmpUuid, {
          cmp_uuid: item.cmp.cmp_uuid,
          cmp_name: item.cmp.cmp_name,
          roles: [],
        });
      }
      grouped.get(cmpUuid).roles.push({
        rol_uuid: item.rol.rol_uuid,
        rol_name: item.rol.rol_name,
        rolpers: item.rolpers.map((e: any) => e.per.per_slug)
      });
    });
    return Array.from(grouped.values());
  }

  public selectCompany(company: any): void {
    this.activeCompany = company;
    this._sessionService.setCompany(JSON.stringify(company));
    this.startNotificationPolling();

    // Recargar componentes para que usen la nueva tienda de la sesión
    this._router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this._router.navigate(['/application/products']);
    });
  }

  public startNotificationPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    const identity = this._sessionService.getIdentity();
    if (!identity || !this.activeCompany) return;

    this.pollingSub = timer(0, 30000).pipe(
      switchMap(() => this.notificationsService.getNotifications(identity.usr_uuid, this.activeCompany.cmp_uuid))
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.notifications = res.data;
          this.unreadCount = this.notifications.filter(n => !n.ntf_isread).length;
        }
      },
      error: (err) => console.error('Error polling notifications:', err)
    });
  }

  public markAsRead(ntf: any): void {
    if (ntf.ntf_isread) {
      if (ntf.ntf_actionurl) {
        this._router.navigate([ntf.ntf_actionurl]);
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

    this.notificationsService.updateNotification(ntf.usr_uuid, ntf.ntf_uuid, payload).subscribe({
      next: () => {
        ntf.ntf_isread = true;
        this.unreadCount = this.notifications.filter(n => !n.ntf_isread).length;
        if (ntf.ntf_actionurl) {
          this._router.navigate([ntf.ntf_actionurl]);
        }
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  public markAllAsRead(): void {
    const unread = this.notifications.filter(n => !n.ntf_isread);
    if (unread.length === 0) return;

    unread.forEach(ntf => {
      const payload = {
        cmp_uuid: ntf.cmp_uuid,
        ntf_title: ntf.ntf_title,
        ntf_message: ntf.ntf_message,
        ntf_type: ntf.ntf_type,
        ntf_isread: true
      };
      this.notificationsService.updateNotification(ntf.usr_uuid, ntf.ntf_uuid, payload).subscribe({
        next: () => {
          ntf.ntf_isread = true;
          this.unreadCount = this.notifications.filter(n => !n.ntf_isread).length;
        }
      });
    });
  }

  public logout(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    this._sessionService.logout();
    this._router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }
}
