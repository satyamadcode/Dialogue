# Dialogue

Mobile app (Expo / React Native) + REST API (Node, Express, SQLite) for finding a therapist or life coach and keeping personal reflections in one place.

Clients register with an email address and password, browse guides, chat, schedule sessions, track daily mood, and write private or guide-shared reflections and gratitude notes. Coaches sign in separately to review reflections a client has explicitly shared with them.

Use Node.js 22 or newer for the API.

## Run the API
    cd backend
    cp .env.example .env      # set JWT_SECRET and ADMIN_KEY
    npm install
    npm start                 # http://localhost:4000, creates dialogue.db and seeds 6 guides

## Run the app
    cd mobile
    npm install
    # In a second terminal, start the API with `cd backend && npm start`.
    # Open the browser preview at http://localhost:8081.
    npm run web

For Expo Go, start the API in one terminal and the app in another:

    # Expo Go / LAN mode does not require an Expo account.
    # iOS simulator uses localhost; Android emulator uses 10.0.2.2.
    # For a real phone, set this to your computer's LAN IP.
    REACT_NATIVE_PACKAGER_HOSTNAME=192.168.x.x EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npm start

## Coach accounts
Coach accounts are provisioned by an administrator; there are no built-in test credentials. Set a private `ADMIN_KEY` in `backend/.env`, then create an account for a guide using their guide ID, chosen email, and a password of at least 10 characters:

    curl -X POST http://localhost:4000/api/admin/coach-accounts \
      -H "x-admin-key: YOUR_ADMIN_KEY" -H "Content-Type: application/json" \
      -d '{"therapist_id":1,"email":"coach@example.com","password":"choose-a-private-password"}'

The coach can then use **Coach sign in** on the welcome screen. The account is linked to exactly one guide and can see only reflections shared with that guide.

## Maintenance mode
    curl -X PUT localhost:4000/api/admin/maintenance -H "x-admin-key: YOUR_ADMIN_KEY" \
      -H "Content-Type: application/json" -d '{"on":true}'

## Notes
- Money is stored in cents. Top-up is a demo; wire Stripe in `POST /api/wallet/topup` for real payments.
- Chat replies are scripted in `server.js` (`reply()`); swap in an LLM call there.
- The explainer is an animated scene sequence driven by `GET /api/explainer`; replace with real video URLs by returning `video_url` and using expo-av.
- Client passwords are stored as bcrypt hashes. Sign-up checks email format but does not verify inbox ownership; add an email provider before relying on verified addresses in production.
- Reflections are private unless the client selects a guide and enables sharing. Mood check-ins and gratitude notes are private.
- SQLite is used so it runs with zero setup. For production move to Postgres; the SQL is standard.
