# Dialogue

Mobile app (Expo / React Native) + REST API (Node, Express, SQLite) that puts therapists and life coaches on one platform.

Clients register, browse guides, watch a short explainer for their question, chat (first 3 minutes free, then billed per minute from a wallet), and schedule sessions with resources. An admin switch puts the whole app in maintenance mode.

## Run the API
    cd backend
    cp .env.example .env      # set JWT_SECRET and ADMIN_KEY
    npm install
    npm start                 # http://localhost:4000, creates dialogue.db and seeds 6 guides

## Run the app
    cd mobile
    npm install
    # Android emulator uses 10.0.2.2; a real phone needs your computer's LAN IP
    EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npx expo start

## Maintenance mode
    curl -X PUT localhost:4000/api/admin/maintenance -H "x-admin-key: YOUR_ADMIN_KEY" \
      -H "Content-Type: application/json" -d '{"on":true}'

## Notes
- Money is stored in cents. Top-up is a demo; wire Stripe in `POST /api/wallet/topup` for real payments.
- Chat replies are scripted in `server.js` (`reply()`); swap in an LLM call there.
- The explainer is an animated scene sequence driven by `GET /api/explainer`; replace with real video URLs by returning `video_url` and using expo-av.
- SQLite is used so it runs with zero setup. For production move to Postgres; the SQL is standard.
# Dialogue
