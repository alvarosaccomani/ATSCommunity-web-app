import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SessionService } from './core/services/session.service';
import { UserRolesCompanyService } from './core/services/user-roles-company.service';

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
    NzDropDownModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isCollapsed = false;
  isAuthRoute = false;
  public userRolesCompany: any[] = [];
  public activeCompany: any = null;

  constructor(
    private _sessionService: SessionService,
    private _userRolesCompanyService: UserRolesCompanyService,
    private _router: Router
  ) {
    this.isAuthRoute = window.location.pathname.startsWith('/auth');
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAuthRoute = event.urlAfterRedirects.startsWith('/auth') || event.url.startsWith('/auth');
    });
  }

  ngOnInit(): void {
    const identity = this._sessionService.getIdentity();
    const currentSession = this._sessionService.getCurrentSession() as any;
    this.activeCompany = currentSession?.company || null;

    if (identity) {
      this._userRolesCompanyService.getUserRolesCompanyByUser(identity.usr_uuid!)
        .subscribe((response: any) => {
          this.userRolesCompany = this.groupByCompany(response.data);

          if (!this.activeCompany && this.userRolesCompany.length > 0) {
            this.activeCompany = this.userRolesCompany[0];
            this._sessionService.setCompany(JSON.stringify(this.activeCompany));
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

    // Recargar componentes para que usen la nueva tienda de la sesión
    this._router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this._router.navigate(['/application/products']);
    });
  }

  public logout(): void {
    this._sessionService.logout();
    this._router.navigate(['/auth/login']);
  }
}
