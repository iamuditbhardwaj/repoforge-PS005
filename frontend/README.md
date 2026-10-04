

## Apni Pechan frontend development

This frontend communicates only with the SetuID FastAPI backend. It never calls Supabase directly and does not require or expose a service-role key.

The product is branded **Apni Pechan** (“Our Identity”). The interface includes English, Hindi, Bengali, Marathi, and Punjabi language options. The selected language is saved locally for the current browser.

1. Start the backend from the `caod` directory:

   ```powershell
   uvicorn main:app --reload
   ```

2. From this project directory, install dependencies and start Vite:

   ```bash
   npm install
   npm run dev
   ```

3. Configure the API base URL in a local `.env` file when needed:

   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

The frontend defaults to `http://127.0.0.1:8000` when `VITE_API_BASE_URL` is not set. For a deployed backend, replace it with the deployed HTTPS URL.
