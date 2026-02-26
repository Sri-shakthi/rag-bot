<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4f61b5b9-2008-4688-b081-1c1ad076635b

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure env from [`.env.example`](./.env.example):
   - `VITE_API_BASE_URL` (backend URL, default `http://localhost:3001`)
   - `VITE_GOOGLE_CLIENT_ID` (Google OAuth Web Client ID)
3. Run the app:
   `npm run dev`

This frontend uses Google SSO and backend cookie sessions. All API calls are made with `credentials: include`.
