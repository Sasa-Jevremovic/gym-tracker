import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { LogWorkout } from './pages/log-workout/log-workout';
import { History } from './pages/history/history';
import { Progress } from './pages/progress/progress';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'log', component: LogWorkout },
  { path: 'history', component: History },
  { path: 'progress', component: Progress },
  { path: '**', redirectTo: 'dashboard' },
];
