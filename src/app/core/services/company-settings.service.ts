import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {

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
   * Obtiene la lista completa de configuraciones para un consorcio.
   */
  public getCompanySettings(cmp_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}companies-settings/${cmp_uuid}`, { headers });
  }

  /**
   * Crea una nueva configuración para el consorcio.
   */
  public saveCompanySetting(setting: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(setting);
    return this._http.post<any>(`${environment.apiUrl}company-setting`, body, { headers });
  }

  /**
   * Actualiza una configuración existente.
   */
  public updateCompanySetting(cmp_uuid: string, cmps_uuid: string, setting: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(setting);
    return this._http.put<any>(`${environment.apiUrl}company-setting/${cmp_uuid}/${cmps_uuid}`, body, { headers });
  }

  /**
   * Elimina una configuración.
   */
  public deleteCompanySetting(cmp_uuid: string, cmps_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}company-setting/${cmp_uuid}/${cmps_uuid}`, { headers });
  }
}
