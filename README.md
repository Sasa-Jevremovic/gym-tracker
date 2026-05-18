# GymTracker

GymTracker is an Angular web application for logging and tracking gym workouts. Record your exercises, monitor your progress over time, and stay motivated with personal records and streak tracking.

## Features

- **Dashboard** — overview of recent workouts, current streak, longest streak, and latest personal records
- **Log Workout** — log a new workout session with exercises, sets, reps, and weight
- **History** — browse your full workout history
- **Progress** — visualize progress for individual exercises over time
- **Workout Templates** — create and reuse workout templates for faster logging
- **Workout Splits** — categorize workouts by split (Upper, Lower, Push, Pull, Legs, Full Body, Rest Day)

## Tech Stack

- [Angular](https://angular.dev/) (v20+) with standalone components and signals
- [Angular CLI](https://github.com/angular/angular-cli) v21.1.2
- [Vitest](https://vitest.dev/) for unit testing
- Local storage for data persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development server

```bash
ng serve
```

Open your browser and navigate to `http://localhost:4200/`. The application reloads automatically on file changes.

### Building

```bash
ng build
```

Build artifacts are stored in the `dist/` directory. The production build is optimized for performance.

### Running unit tests

```bash
ng test
```

## Project Structure

```
src/
├── app/
│   ├── components/       # Shared UI components (e.g. nav)
│   ├── models/           # TypeScript interfaces (Workout, Exercise, Set, WorkoutTemplate)
│   ├── pages/            # Route-level page components
│   │   ├── dashboard/
│   │   ├── history/
│   │   ├── log-workout/
│   │   └── progress/
│   └── services/         # Business logic and local storage adapters
└── main.ts
```

## Additional Resources

- [Angular Documentation](https://angular.dev/)
- [Angular CLI Reference](https://angular.dev/tools/cli)
