import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

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

  public singup(user: any): Observable<any> {
    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('content-type','application/json');

    return this._http.post(environment.apiUrl + 'register', params, {headers:headers});
  }

  public login(user: any, gettoken: string | null = null): Observable<any> {
    if (gettoken != null) {
      user.gettoken = gettoken;
    }

    let params = JSON.stringify(user);
    let headers = new HttpHeaders().set('content-type', 'application/json');

    return this._http.post(environment.apiUrl + 'login', params, { headers: headers });
  }

  public getUsers(filter: string = '', page: number = 1, perPage: number = 100): Observable<any> {
    const headers = this.getHeaders();
    let params = new HttpParams();

    if (filter) {
      params = params.set('filter', filter);
    }

    if (page) {
      params = params.set('page', page.toString());
    }

    if (perPage) {
      params = params.set('perPage', perPage.toString());
    }
    
    return this._http.get<any>(`${environment.apiUrl}users`, { headers, params });
  }

  /**
   * Obtiene un usuario específico por su UUID.
   */
  public getUserById(usr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}user/${usr_uuid}`, { headers });
  }

  /**
   * Actualiza los datos de un usuario.
   */
  public updateUser(usr_uuid: string, user: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(user);
    return this._http.put<any>(`${environment.apiUrl}user/${usr_uuid}`, body, { headers });
  }
}
