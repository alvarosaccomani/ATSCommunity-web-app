import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TendersService {

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
   * Obtiene las licitaciones vinculadas a un reclamo específico.
   */
  public getTenders(cmp_uuid: string, cla_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}tenders/${cmp_uuid}/${cla_uuid}`, { headers });
  }

  /**
   * Crea una nueva convocatoria de licitación para un reclamo.
   */
  public saveTender(tender: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(tender);
    return this._http.post<any>(`${environment.apiUrl}tender`, body, { headers });
  }

  /**
   * Actualiza el estado o plazo de una licitación.
   */
  public updateTender(cmp_uuid: string, cla_uuid: string, ten_uuid: string, tender: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(tender);
    return this._http.put<any>(`${environment.apiUrl}tender/${cmp_uuid}/${cla_uuid}/${ten_uuid}`, body, { headers });
  }

  /**
   * Elimina una licitación.
   */
  public deleteTender(cmp_uuid: string, cla_uuid: string, ten_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}tender/${cmp_uuid}/${cla_uuid}/${ten_uuid}`, { headers });
  }
}
