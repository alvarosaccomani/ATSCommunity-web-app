import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class VotesService {

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
   * Obtiene todos los votos emitidos para una licitación.
   */
  public getVotes(cmp_uuid: string, cla_uuid: string, ten_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}votes/${cmp_uuid}/${cla_uuid}/${ten_uuid}`, { headers });
  }

  /**
   * Registra el voto del habitante por un presupuesto específico.
   */
  public saveVote(vote: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(vote);
    return this._http.post<any>(`${environment.apiUrl}vote`, body, { headers });
  }
}
