import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SpacesService {

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

  public getSpacesBySite(cmp_uuid: string, sit_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}spaces-by-site/${cmp_uuid}/${sit_uuid}`, { headers });
  }

  /**
   * Obtiene todos los espacios de una empresa/comunidad.
   */
  public getSpaces(cmp_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}spaces/${cmp_uuid}`, { headers });
  }

  /**
   * Obtiene los detalles de un espacio específico.
   */
  public getSpaceById(cmp_uuid: string, sit_uuid: string, spa_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}space/${cmp_uuid}/${sit_uuid}/${spa_uuid}`, { headers });
  }

  /**
   * Crea un nuevo espacio.
   */
  public saveSpace(space: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(space);
    return this._http.post<any>(`${environment.apiUrl}space`, body, { headers });
  }

  /**
   * Actualiza un espacio existente.
   */
  public updateSpace(cmp_uuid: string, sit_uuid: string, spa_uuid: string, space: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(space);
    return this._http.put<any>(`${environment.apiUrl}space/${cmp_uuid}/${sit_uuid}/${spa_uuid}`, body, { headers });
  }

  /**
   * Elimina un espacio.
   */
  public deleteSpace(cmp_uuid: string, sit_uuid: string, spa_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}space/${cmp_uuid}/${sit_uuid}/${spa_uuid}`, { headers });
  }
}

