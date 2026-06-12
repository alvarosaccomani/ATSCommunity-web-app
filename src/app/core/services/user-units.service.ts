import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserUnitResults } from '../interfaces/user-unit';

@Injectable({
  providedIn: 'root'
})
export class UserUnitsService {

  constructor(
    private _http: HttpClient
  ) { }

  /**
   * Obtiene todos las unidades de un usuario.
   * @returns Observable de un array de unidades de un usuario.
   */
  public getUserUnits(cmp_uuid: string, usr_uuid: string): Observable<UserUnitResults> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = new HttpParams();
    return this._http.get<UserUnitResults>(`${environment.apiUrl}user-units/${cmp_uuid}/${usr_uuid}`, { headers, params });
  }

  /**
   * Obtiene los detalles de una asignación específica.
   */
  public getUserUnitById(cmp_uuid: string, usr_uuid: string, uni_uuid: string): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    return this._http.get<any>(`${environment.apiUrl}user-unit/${cmp_uuid}/${usr_uuid}/${uni_uuid}`, { headers });
  }

  /**
   * Crea una nueva asignación de unidad a un usuario.
   */
  public saveUserUnit(userUnit: any): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = JSON.stringify(userUnit);
    return this._http.post<any>(`${environment.apiUrl}user-unit`, params, { headers });
  }

  /**
   * Actualiza una asignación de unidad existente.
   */
  public updateUserUnit(cmp_uuid: string, usr_uuid: string, uni_uuid: string, userUnit: any): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = JSON.stringify(userUnit);
    return this._http.put<any>(`${environment.apiUrl}user-unit/${cmp_uuid}/${usr_uuid}/${uni_uuid}`, params, { headers });
  }

  /**
   * Elimina una asignación de unidad.
   */
  public deleteUserUnit(cmp_uuid: string, usr_uuid: string, uni_uuid: string): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    return this._http.delete<any>(`${environment.apiUrl}user-unit/${cmp_uuid}/${usr_uuid}/${uni_uuid}`, { headers });
  }

  /**
   * Obtiene todos los habitantes asignados a una unidad.
   */
  public getUnitUsers(cmp_uuid: string, uni_uuid: string): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    return this._http.get<any>(`${environment.apiUrl}user-units/unit/${cmp_uuid}/${uni_uuid}`, { headers });
  }
}
