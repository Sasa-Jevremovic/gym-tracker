import { TestBed } from '@angular/core/testing';
import { ExerciseService } from './exercise';
import { STORAGE_ADAPTER, StorageAdapter } from './storage-adapter';

function makeStorageAdapter(): StorageAdapter & { store: Record<string, unknown> } {
  const store: Record<string, unknown> = {};
  return {
    store,
    get<T>(key: string): T | null {
      return key in store ? (store[key] as T) : null;
    },
    set<T>(key: string, value: T): void {
      store[key] = value;
    },
  };
}

describe('ExerciseService – favorites', () => {
  let service: ExerciseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_ADAPTER, useValue: makeStorageAdapter() }],
    });
    service = TestBed.inject(ExerciseService);
  });

  it('starts with no favorites', () => {
    expect(service.favoriteIds().size).toBe(0);
    expect(service.sortedExercises().favorites).toHaveLength(0);
  });

  it('isFavorite returns false for unknown id', () => {
    expect(service.isFavorite('bench-press')).toBeFalsy();
  });

  it('toggleFavorite marks an exercise as favorite', () => {
    service.toggleFavorite('bench-press');
    expect(service.isFavorite('bench-press')).toBeTruthy();
  });

  it('toggleFavorite removes an exercise from favorites when already favorited', () => {
    service.toggleFavorite('squat');
    service.toggleFavorite('squat');
    expect(service.isFavorite('squat')).toBeFalsy();
  });

  it('sortedExercises puts favorites first and excludes them from rest', () => {
    service.toggleFavorite('deadlift');
    const { favorites, rest } = service.sortedExercises();
    expect(favorites.map(e => e.id)).toContain('deadlift');
    expect(rest.map(e => e.id)).not.toContain('deadlift');
  });

  it('persists favorites to storage', () => {
    const adapter = TestBed.inject(STORAGE_ADAPTER) as ReturnType<typeof makeStorageAdapter>;
    service.toggleFavorite('bench-press');
    const stored = adapter.get<string[]>('gymtracker_favorite_exercise_ids');
    expect(stored).toContain('bench-press');
  });
});
