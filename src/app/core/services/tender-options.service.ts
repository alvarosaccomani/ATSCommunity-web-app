import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TenderOptionsService {

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
   * Obtiene las propuestas/presupuestos de proveedores para una licitación.
   */
  public getTenderOptions(cmp_uuid: string, cla_uuid: string, ten_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}tender-options/${cmp_uuid}/${cla_uuid}/${ten_uuid}`, { headers });
  }

  /**
   * Agrega un nuevo presupuesto de proveedor a la licitación.
   */
  public saveTenderOption(option: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(option);
    return this._http.post<any>(`${environment.apiUrl}tender-option`, body, { headers });
  }

  /**
   * Modifica un presupuesto de proveedor.
   */
  public updateTenderOption(cmp_uuid: string, cla_uuid: string, ten_uuid: string, tenopt_uuid: string, option: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(option);
    return this._http.put<any>(`${environment.apiUrl}tender-option/${cmp_uuid}/${cla_uuid}/${ten_uuid}/${tenopt_uuid}`, body, { headers });
  }

  /**
   * Elimina un presupuesto de proveedor.
   */
  public deleteTenderOption(cmp_uuid: string, cla_uuid: string, ten_uuid: string, tenopt_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}tender-option/${cmp_uuid}/${cla_uuid}/${ten_uuid}/${tenopt_uuid}`, { headers });
  }
}
