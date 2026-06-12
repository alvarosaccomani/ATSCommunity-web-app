import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeeResults } from '../interfaces/fee';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class FeesService {

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
   * Obtiene las expensas con soporte para filtros.
   */
  public getFees(cmp_uuid: string, filters: any = {}): Observable<FeeResults> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (filters.usr_uuid) params = params.set('usr_uuid', filters.usr_uuid);
    if (filters.uni_uuid) params = params.set('uni_uuid', filters.uni_uuid);
    if (filters.usruni_uuid) params = params.set('usruni_uuid', filters.usruni_uuid);
    if (filters.fee_status) params = params.set('fee_status', filters.fee_status);
    if (filters.fee_period) params = params.set('fee_period', filters.fee_period);

    return this._http.get<FeeResults>(`${environment.apiUrl}fees/${cmp_uuid}`, { headers, params });
  }

  /**
   * Crea una nueva expensa.
   */
  public saveFee(fee: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(fee);
    return this._http.post<any>(`${environment.apiUrl}fee`, body, { headers });
  }

  /**
   * Actualiza una expensa existente.
   */
  public updateFee(cmp_uuid: string, usr_uuid: string, uni_uuid: string, usruni_uuid: string, fee_uuid: string, fee: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(fee);
    return this._http.put<any>(`${environment.apiUrl}fee/${cmp_uuid}/${usr_uuid}/${uni_uuid}/${usruni_uuid}/${fee_uuid}`, body, { headers });
  }

  /**
   * Elimina una expensa.
   */
  public deleteFee(cmp_uuid: string, usr_uuid: string, uni_uuid: string, usruni_uuid: string, fee_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}fee/${cmp_uuid}/${usr_uuid}/${uni_uuid}/${usruni_uuid}/${fee_uuid}`, { headers });
  }
}
