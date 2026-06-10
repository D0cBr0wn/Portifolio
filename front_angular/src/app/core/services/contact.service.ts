import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly api = inject(ApiService);

  sendMessage(payload: ContactPayload): Observable<ContactMessage> {
    return this.api.post<ContactMessage>('/contact', payload);
  }

  getMessages(): Observable<ContactMessage[]> {
    return this.api.get<ContactMessage[]>('/contact');
  }
}
