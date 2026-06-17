import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class SitesService {

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
   * Obtiene todas las sedes de una comunidad/empresa.
   */
  public getSites(cmp_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}sites/${cmp_uuid}`, { headers });
  }

  /**
   * Obtiene los detalles de una sede específica.
   */
  public getSiteById(cmp_uuid: string, sit_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}site/${cmp_uuid}/${sit_uuid}`, { headers });
  }

  /**
   * Crea una nueva sede.
   */
  public saveSite(site: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(site);
    return this._http.post<any>(`${environment.apiUrl}site`, body, { headers });
  }

  /**
   * Actualiza una sede existente.
   */
  public updateSite(cmp_uuid: string, sit_uuid: string, site: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(site);
    return this._http.put<any>(`${environment.apiUrl}site/${cmp_uuid}/${sit_uuid}`, body, { headers });
  }

  /**
   * Elimina una sede.
   */
  public deleteSite(cmp_uuid: string, sit_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}site/${cmp_uuid}/${sit_uuid}`, { headers });
  }
}

