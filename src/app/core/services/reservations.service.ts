import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {

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
   * Obtiene todas las reservas de un espacio.
   */
  public getReservationsBySpace(cmp_uuid: string, sit_uuid: string, spa_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}reservations-by-space/${cmp_uuid}/${sit_uuid}/${spa_uuid}`, { headers });
  }

  /**
   * Obtiene todas las reservas de un usuario.
   */
  public getReservationsByUser(cmp_uuid: string, usr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}reservations-by-user/${cmp_uuid}/${usr_uuid}`, { headers });
  }

  /**
   * Obtiene todas las reservas de una empresa/comunidad.
   */
  public getReservations(cmp_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}reservations/${cmp_uuid}`, { headers });
  }

  /**
   * Obtiene los detalles de una reserva específica.
   */
  public getReservationById(cmp_uuid: string, sit_uuid: string, spa_uuid: string, usr_uuid: string, res_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}reservation/${cmp_uuid}/${sit_uuid}/${spa_uuid}/${usr_uuid}/${res_uuid}`, { headers });
  }

  /**
   * Crea una nueva reserva.
   */
  public saveReservation(reservation: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(reservation);
    return this._http.post<any>(`${environment.apiUrl}reservation`, body, { headers });
  }

  /**
   * Actualiza una reserva existente (por ejemplo, cambiar su estado).
   */
  public updateReservation(cmp_uuid: string, sit_uuid: string, spa_uuid: string, usr_uuid: string, res_uuid: string, reservation: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(reservation);
    return this._http.put<any>(`${environment.apiUrl}reservation/${cmp_uuid}/${sit_uuid}/${spa_uuid}/${usr_uuid}/${res_uuid}`, body, { headers });
  }

  /**
   * Elimina/Cancela una reserva.
   */
  public deleteReservation(cmp_uuid: string, sit_uuid: string, spa_uuid: string, usr_uuid: string, res_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}reservation/${cmp_uuid}/${sit_uuid}/${spa_uuid}/${usr_uuid}/${res_uuid}`, { headers });
  }
}

