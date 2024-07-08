
# MSU Class Scheduler

MSU Class Scheduler is an Angular web app designed to make MSU course scheduling easier. It features a visual scheduler and is set to include AI-powered semester planning and grade calculation in the future.


## 🚀 Live demo: [msu-class-scheduler.web.app](http://msu-class-scheduler.web.app)


## Key Features (Current and Upcoming)

- Visual Scheduling: Easily visualize your schedule, identify conflicts, and optimize your time
- AI Semester Planner (Future): Intelligent recommendations for optimal course combinations
- Grade Calculator (Future): Calculate your potential overall grade for a course



## Run Locally

1. Clone the project

```bash
  git clone https://github.com/aaronjonesii/msu-class-scheduler
```

2. Install dependencies

```bash
  cd msu-class-scheduler
  npm i
```

3. Configure Firebase: Update `environment.ts` and `environment.development.ts` in the `src/environments` directory with your Firebase project settings.

4. Create `keys.ts`: Add this file to the `src/environments` directory
```typescript
// filename: keys.ts

  export const FIREBASE_API_KEY = '<Your Firebase Project API Key>';
  export const RECAPTCHA3_SITE_KEY = 'Your Recaptcha3 Site Key';
```


5. Start the development server with local emulators

```bash
  npm run dev
```


## 🛠️ Tech Stack
- Client: Angular
- Server: Firebase
- Additional:
    - Progressive Web Application (Service Worker)
    - Server-Side Rendering (SSR - not yet implemented in the live demo)


## 🧪 Running Tests

Unit tests:

```bash
  npm run test
```
Headless unit tests:
```bash
  npm run test:headless
```


## 🛣️ Roadmap

- Schedule sharing via links
- AI Semester planner
- Grade Calculator


## 🤝 Feedback & Support

Have feedback, suggestions, or need help? Email me at [jonesaa5@msu.edu](mailto:jonesaa5@msu.edu)
## ℹ️ Additional Information
- Optimizations: The app is built as a Progressive Web App (PWA) for fast loading and offline capabilities. Server-Side Rendering (SSR) is installed but not yet implemented in the live demo.

- Used By: This project is being actively developed by me, an MSU student. I plan to expand its functionality to benefit all Spartans soon.

- License: [MIT](https://choosealicense.com/licenses/mit/)