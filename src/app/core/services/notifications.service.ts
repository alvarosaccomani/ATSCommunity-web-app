import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(
    private _http: HttpClient,
    private sessionService: SessionService
  ) { }

  private getHeaders(): HttpHeaders {
    const session = this.sessionService.getCurrentSession();
    const token = session?.token;
    let headers = new HttpHeaders().set('content-type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Obtiene la lista de notificaciones para un usuario.
   */
  public getNotifications(usr_uuid: string, page?: number, perPage?: number): Observable<any> {
    const headers = this.getHeaders();
    let url = `${environment.apiUrl}notifications/${usr_uuid}`;
    if (page !== undefined && perPage !== undefined) {
      url += `/${page}/${perPage}`;
    }
    return this._http.get<any>(url, { headers });
  }

  /**
   * Obtiene el detalle de una notificación.
   */
  public getNotificationDetail(usr_uuid: string, ntf_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}notification/${usr_uuid}/${ntf_uuid}`, { headers });
  }

  /**
   * Crea una nueva notificación.
   */
  public saveNotification(notification: {
    usr_uuid: string;
    cmp_uuid: string;
    ntf_title: string;
    ntf_message: string;
    ntf_type: 'info' | 'warning' | 'success' | 'error';
    ntf_isread: boolean;
    ntf_actionurl?: string;
  }): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(notification);
    return this._http.post<any>(`${environment.apiUrl}notification`, body, { headers });
  }

  /**
   * Actualiza una notificación existente (ej. marcar como leída).
   */
  public updateNotification(
    usr_uuid: string,
    ntf_uuid: string,
    notification: {
      cmp_uuid: string;
      ntf_title: string;
      ntf_message: string;
      ntf_type: string;
      ntf_isread: boolean;
    }
  ): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(notification);
    return this._http.put<any>(`${environment.apiUrl}notification/${usr_uuid}/${ntf_uuid}`, body, { headers });
  }

  /**
   * Elimina una notificación.
   */
  public deleteNotification(usr_uuid: string, ntf_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}notification/${usr_uuid}/${ntf_uuid}`, { headers });
  }
}

