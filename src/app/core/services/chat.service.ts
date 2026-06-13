import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

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
   * Obtiene todas las salas de chat de la comunidad.
   */
  public getChatRooms(cmp_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}chat-rooms/${cmp_uuid}`, { headers });
  }

  /**
   * Obtiene los detalles de una sala específica.
   */
  public getDetailChatRoom(cmp_uuid: string, chr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}chat-room/${cmp_uuid}/${chr_uuid}`, { headers });
  }

  /**
   * Crea una nueva sala de chat.
   */
  public saveChatRoom(room: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(room);
    return this._http.post<any>(`${environment.apiUrl}chat-room`, body, { headers });
  }

  /**
   * Actualiza una sala de chat existente.
   */
  public updateChatRoom(cmp_uuid: string, chr_uuid: string, room: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(room);
    return this._http.put<any>(`${environment.apiUrl}chat-room/${cmp_uuid}/${chr_uuid}`, body, { headers });
  }

  /**
   * Elimina una sala de chat.
   */
  public deleteChatRoom(cmp_uuid: string, chr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}chat-room/${cmp_uuid}/${chr_uuid}`, { headers });
  }

  /**
   * Obtiene todos los mensajes de una sala de chat específica.
   */
  public getChatMessages(cmp_uuid: string, chr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}chat-messages/${cmp_uuid}/${chr_uuid}`, { headers });
  }

  /**
   * Registra un nuevo mensaje en una sala de chat.
   */
  public sendChatMessage(message: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(message);
    return this._http.post<any>(`${environment.apiUrl}chat-message`, body, { headers });
  }

  /**
   * Obtiene los miembros de una sala específica.
   */
  public getChatMembers(cmp_uuid: string, chr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.get<any>(`${environment.apiUrl}chat-members/${cmp_uuid}/${chr_uuid}`, { headers });
  }

  /**
   * Agrega un nuevo miembro a una sala de chat.
   */
  public addChatMember(member: any): Observable<any> {
    const headers = this.getHeaders();
    const body = JSON.stringify(member);
    return this._http.post<any>(`${environment.apiUrl}chat-member`, body, { headers });
  }

  /**
   * Elimina un miembro de una sala de chat.
   */
  public removeChatMember(cmp_uuid: string, chr_uuid: string, usr_uuid: string): Observable<any> {
    const headers = this.getHeaders();
    return this._http.delete<any>(`${environment.apiUrl}chat-member/${cmp_uuid}/${chr_uuid}/${usr_uuid}`, { headers });
  }
}
