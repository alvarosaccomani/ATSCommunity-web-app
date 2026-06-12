import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UnitResults } from '../interfaces/unit';

@Injectable({
  providedIn: 'root'
})
export class UnitsService {

  constructor(
    private _http: HttpClient
  ) { }

  /**
   * Obtiene todos las unidades.
   * @returns Observable de un array de unidades.
   */
  public getUnits(cmp_uuid: string): Observable<UnitResults> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = new HttpParams();
    return this._http.get<UnitResults>(`${environment.apiUrl}units/${cmp_uuid}`, { headers, params });
  }

  /**
   * Obtiene los detalles de una unidad específica.
   */
  public getUnitById(cmp_uuid: string, uni_uuid: string): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    return this._http.get<any>(`${environment.apiUrl}unit/${cmp_uuid}/${uni_uuid}`, { headers });
  }

  /**
   * Crea una nueva unidad.
   */
  public saveUnit(unit: any): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = JSON.stringify(unit);
    return this._http.post<any>(`${environment.apiUrl}unit`, params, { headers });
  }

  /**
   * Actualiza una unidad existente.
   */
  public updateUnit(cmp_uuid: string, uni_uuid: string, unit: any): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    let params = JSON.stringify(unit);
    return this._http.put<any>(`${environment.apiUrl}unit/${cmp_uuid}/${uni_uuid}`, params, { headers });
  }

  /**
   * Elimina una unidad.
   */
  public deleteUnit(cmp_uuid: string, uni_uuid: string): Observable<any> {
    const headers = new HttpHeaders().set('content-type', 'application/json');
    return this._http.delete<any>(`${environment.apiUrl}unit/${cmp_uuid}/${uni_uuid}`, { headers });
  }
}
