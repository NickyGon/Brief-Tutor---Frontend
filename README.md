# Brief Tutor

Next.js and Tailwind interface for the Brief Tutor workflow in the sibling `Brief Tutor` folder.

Search reads saved diagnoses, family-similarity JSON, and campaign spreadsheets from that project. A result is shown only after the response for the current search comes back. Evaluate Campaign Brief sets `BRIEF_POST_PARSE_ROUTE=1`. Search for similar briefs sets `BRIEF_POST_PARSE_ROUTE=0`. The previous result stays on screen until that run finishes.

## Run both apps

From `Brief Tutor`:

```bash
py -3.13 -m uvicorn api.server:app --host 127.0.0.1 --port 8000
```

From this folder:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`BRIEF_TUTOR_API_URL` overrides the API address. The default is `http://127.0.0.1:8000`.
