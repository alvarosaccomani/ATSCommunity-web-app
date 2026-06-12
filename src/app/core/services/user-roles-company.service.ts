import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRolCompanyResults } from '../interfaces/user-rol-company';

@Injectable({
  providedIn: 'root'
})
export class UserRolesCompanyService {

  constructor(
    private _http: HttpClient
  ) { }

  public getUserRolesCompanyByUser(usr_uuid: string): Observable<UserRolCompanyResults> {
    let headers = new HttpHeaders().set('content-type', 'application/json');

    return this._http.get<UserRolCompanyResults>(environment.apiUrl + 'user-roles-company-by-user/' + usr_uuid, { headers: headers })
  }
}
