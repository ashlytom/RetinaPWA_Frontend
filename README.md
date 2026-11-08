# RetinaPWA Frontend

Next.js (TypeScript, Tailwind 3) PWA for the diabetic retinopathy screening prototype.
**Research prototype - not a medical device.**

    cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the backend
    npm install
    npm run dev                  # http://localhost:3000
    npm run build && npm start   # production build (service worker only active here)

Backend: https://github.com/ashlytom/RetinaPWA_Backend

Note: Tailwind is pinned to v3 because Tailwind v4 needs Node >= 20.19.
