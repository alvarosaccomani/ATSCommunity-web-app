import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimImagesService {

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
   * Obtiene las imágenes de un reclamo.
   */
  public getClaimImages(cmp_uuid: string, cla_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}claim-images/${cmp_uuid}/${cla_uuid}`, { headers });
  }

  /**
   * Guarda una nueva imagen de un reclamo (Base64).
   */
  public saveClaimImage(image: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(image);
    return this._http.post<any>(`${environment.apiUrl}claim-image`, body, { headers });
  }
}
