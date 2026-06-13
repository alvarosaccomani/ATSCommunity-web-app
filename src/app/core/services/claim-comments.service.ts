import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimCommentsService {

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
   * Obtiene los comentarios de un reclamo.
   */
  public getClaimComments(cmp_uuid: string, cla_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}claim-comments/${cmp_uuid}/${cla_uuid}`, { headers });
  }

  /**
   * Guarda un nuevo comentario en un reclamo.
   */
  public saveClaimComment(comment: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(comment);
    return this._http.post<any>(`${environment.apiUrl}claim-comment`, body, { headers });
  }
}
