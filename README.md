# Claude 3 Comparison

This is a Next.js project that compares responses from two different Claude 3 models: Haiku and Sonnet.

## Getting Started

First, run the development server:


```bash
npm run dev
or
yarn dev
or
pnpm dev
or
bun dev
```



Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Compares responses from Claude 3 Haiku, Claude 3 Sonnet, OpenAI, and Google Gemini models
- Streams responses in real-time
- Maintains conversation history for all models
- Stores responses in Supabase for analysis and tracking
- Supports multiple AI models.

## Dependencies

This project uses several key dependencies:

- Next.js for the React framework
- @anthropic-ai/sdk for interacting with Claude models
- @supabase/supabase-js for database interactions
- react-markdown for rendering Markdown content
- tailwindcss for styling

For a full list of dependencies, refer to the `package.json` file.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.