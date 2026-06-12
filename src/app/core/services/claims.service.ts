import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimsService {

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
   * Obtiene todos los reclamos con soporte para filtros.
   */
  public getClaims(cmp_uuid: string, filters: any = {}): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (filters.usr_uuid) params = params.set('usr_uuid', filters.usr_uuid);
    if (filters.uni_uuid) params = params.set('uni_uuid', filters.uni_uuid);
    if (filters.cla_status) params = params.set('cla_status', filters.cla_status);
    if (filters.cla_type) params = params.set('cla_type', filters.cla_type);

    return this._http.get<any>(`${environment.apiUrl}claims/${cmp_uuid}`, { headers, params });
  }

  /**
   * Obtiene los detalles de un reclamo específico.
   */
  public getClaimById(cmp_uuid: string, cla_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}claim/${cmp_uuid}/${cla_uuid}`, { headers });
  }

  /**
   * Crea un nuevo reclamo.
   */
  public saveClaim(claim: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(claim);
    return this._http.post<any>(`${environment.apiUrl}claim`, body, { headers });
  }

  /**
   * Actualiza un reclamo existente (por ejemplo, cambiar su estado).
   */
  public updateClaim(cmp_uuid: string, cla_uuid: string, claim: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(claim);
    return this._http.put<any>(`${environment.apiUrl}claim/${cmp_uuid}/${cla_uuid}`, body, { headers });
  }

  /**
   * Elimina un reclamo.
   */
  public deleteClaim(cmp_uuid: string, cla_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}claim/${cmp_uuid}/${cla_uuid}`, { headers });
  }
}
