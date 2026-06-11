import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SessionService } from './core/services/session.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    RouterLink, 
    RouterOutlet, 
    NzIconModule, 
    NzLayoutModule, 
    NzMenuModule,
    NzButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isCollapsed = false;
  isAuthRoute = false;

  constructor(
    private router: Router,
    private _sessionService: SessionService
  ) {
    this.isAuthRoute = window.location.pathname.startsWith('/auth');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAuthRoute = event.urlAfterRedirects.startsWith('/auth') || event.url.startsWith('/auth');
    });
  }

  public logout(): void {
    this._sessionService.logout();
    this.router.navigate(['/auth/login']);
  }
}
