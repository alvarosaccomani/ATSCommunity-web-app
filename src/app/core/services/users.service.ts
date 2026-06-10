import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(
    private _http: HttpClient
  ) { }

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
}
