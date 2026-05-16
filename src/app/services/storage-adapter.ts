import { InjectionToken } from '@angular/core';

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('StorageAdapter', {
  providedIn: 'root',
  factory: () => new LocalStorageAdapter(),
});
