import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionResults } from '../interfaces/transaction';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

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
   * Obtiene las transacciones con soporte para filtros.
   */
  public getTransactions(cmp_uuid: string, filters: any = {}): Observable<TransactionResults> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    if (filters.usr_uuid) params = params.set('usr_uuid', filters.usr_uuid);
    if (filters.uni_uuid) params = params.set('uni_uuid', filters.uni_uuid);
    if (filters.usruni_uuid) params = params.set('usruni_uuid', filters.usruni_uuid);
    if (filters.fee_uuid) params = params.set('fee_uuid', filters.fee_uuid);
    if (filters.tra_status) params = params.set('tra_status', filters.tra_status);

    return this._http.get<TransactionResults>(`${environment.apiUrl}transactions/${cmp_uuid}`, { headers, params });
  }

  /**
   * Registra una nueva transacción de pago.
   */
  public saveTransaction(transaction: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(transaction);
    return this._http.post<any>(`${environment.apiUrl}transaction`, body, { headers });
  }
}
