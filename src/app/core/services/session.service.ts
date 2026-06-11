import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SessionData {
  identity?: any;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private sessionSubject = new BehaviorSubject<SessionData | null>(this.getStoredSession());

  constructor() { }

  public setIdentity(identity: any | string): void {
    const identityObj = typeof identity === 'string'
      ? JSON.parse(identity)
      : identity;

    const current = this.getCurrentSession();
    const updated = { ...current, identity: identityObj };
    this.updateSession(updated);
  }

  public setToken(token: string): void {
    const current = this.getCurrentSession();
    const updated = { ...current, token };
    this.updateSession(updated);
  }

  public getCurrentSession(): SessionData | null {
    return this.sessionSubject.value;
  }

  public logout(): void {
    localStorage.removeItem('session');
    this.sessionSubject.next(null);
  }

  private updateSession(session: SessionData): void {
    localStorage.setItem('session', JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private getStoredSession(): SessionData | null {
    try {
      const stored = localStorage.getItem('session');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored session:', error);
      return null;
    }
  }
}
