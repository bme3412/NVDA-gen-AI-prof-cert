# NVDA Gen AI LLMs Study Tracker

A comprehensive study companion application designed to help you prepare for the NVDA Gen AI LLM Professional Certification. This app enables you to track your progress through exam topics, take rich text notes, and generate study questions.

## Features

- **Topic Tracking**: Organized view of all exam topics and subtopics with progress indicators.
- **Rich Text Notes**: Integrated rich text editor for taking detailed notes on each reading and subtopic.
- **Progress Monitoring**: Visual progress bars and completion status for topics and readings.
- **Data Persistence**:
  - **Local Storage**: Automatically saves your progress and notes to your browser's local storage.
  - **Cloud Sync**: (Optional) Syncs your data to the cloud using Vercel Blob storage for cross-device access.
- **Study Aids**:
  - Generate study questions and quizzes (AI-powered).
  - View summaries and study guides.
- **Responsive Design**: Optimized for both desktop and mobile viewing.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: Standard CSS with CSS Modules/Variables (no heavy UI frameworks)
- **Deployment & Storage**: [Vercel](https://vercel.com) (Analytics, Blob Storage)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd nvda-prof-reading
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

To enable all features, you will need to configure environment variables in a `.env.local` file.

### Cloud Sync (Optional)
To enable cloud sync via Vercel Blob:
```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### AI Question Generation (Optional)
To enable the AI-powered question generator (uses OpenAI):
```env
OPENAI_API_KEY=your_openai_api_key
```

## Updating the seed dataset

If you enrich your local/cloud notes and want new installs to start with that content:

1. Export your latest data. In the browser console run:<br>`copy(localStorage.getItem('nvdaGenAILLMStudyTrackerV1'))` and paste the clipboard into a file such as `~/Desktop/latest-notes.json`.
2. Run the helper script to overwrite the seed file:
   ```bash
   node scripts/update-seed.mjs ~/Desktop/latest-notes.json
   ```
3. (Optional) Verify by restarting `npm run dev` and visiting [http://localhost:3000/notes-seed.json](http://localhost:3000/notes-seed.json); you should see the updated JSON.

The script validates that the source JSON contains a top-level `topics` object before writing to `public/notes-seed.json`.

## License

[MIT](LICENSE)
