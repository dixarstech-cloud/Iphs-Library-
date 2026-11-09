# Gemini for teachers: set up the proxy

The proxy is a small program (`gemini-proxy.js`) that runs free on Cloudflare. It holds your Gemini key so the key never appears in the app or on GitHub. Teachers type a **teacher access code**, the proxy checks it, and only then asks Gemini.

Students never see Gemini. The app only lets accounts with the role **Teacher** switch it on.

## 1. Get a Gemini key
1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Choose **Create API key** and copy it. Keep it private. Never put it in the app files or on GitHub.

## 2. Create the proxy on Cloudflare (no command line)
1. Make a free account at https://dash.cloudflare.com and open **Workers & Pages**.
2. Choose **Create**, then **Create Worker**. Name it `iphs-gemini-proxy` and choose **Deploy**.
3. Choose **Edit code**. Delete everything in the editor, paste the whole of `gemini-proxy.js` from this folder, then choose **Deploy**.
4. Open the Worker's **Settings**, then **Variables and Secrets**, and add:
   | Name | Type | Value |
   |---|---|---|
   | `GEMINI_API_KEY` | Secret | the key from step 1 |
   | `TEACHER_CODES` | Secret | one or more codes separated by commas, for example `BLUE-HERON-42,MARY-2026` |
   | `ALLOWED_ORIGINS` | Text | your app address with no path, for example `https://yourname.github.io` |
5. Choose **Deploy** again. Your proxy address is shown on the Worker page, like `https://iphs-gemini-proxy.yourname.workers.dev`.
6. Open that address in a browser. You should see `{"ok":true,"service":"iphs-gemini-proxy","ready":true}`. If `ready` is false, one of the two secrets is missing.

Good codes are long and hard to guess. Give each teacher their own, so you can remove one by deleting it from `TEACHER_CODES`.

## 3. Connect the app
Easiest for everyone: open `app.js`, find `const DEFAULT_PROXY_URL = "";` and put your proxy address between the quotes, then upload the file to GitHub again. Teachers then only type their code.

Or each teacher does it by hand: Settings, Ask Library AI with Gemini, switch to **Online**, choose **School proxy**, enter the proxy address and the teacher access code, choose **Test connection**, then **Save**. Tick "Remember the access code on this device" on a phone only they use.

## Limits and safety
- Each teacher code can send 8 questions a minute and 200 a day by default. Change them with the text variables `PER_MINUTE` and `PER_DAY`.
- Only these models are allowed: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash. Change the list with `ALLOWED_MODELS`.
- The proxy accepts only short requests, never stores questions or answers, and refuses any website not listed in `ALLOWED_ORIGINS`.
- For exact limits across all Cloudflare locations, create a **KV namespace** and bind it to the Worker with the name `RATE`. Without it, limits are counted per location, which is fine for one school.
- Gemini's own free quota still applies. If it runs out the app shows "Gemini is busy or its free limit is used up" and teachers can switch back to Offline.
- If a code leaks, remove it from `TEACHER_CODES` and deploy. If the Gemini key leaks, delete it in Google AI Studio and make a new one.
- Questions and book passages sent in Online mode go to Google. See the Privacy page in the app.

## Using the command line instead
`wrangler.toml` is included. Edit `ALLOWED_ORIGINS`, then run `npx wrangler deploy`, `npx wrangler secret put GEMINI_API_KEY` and `npx wrangler secret put TEACHER_CODES`.
