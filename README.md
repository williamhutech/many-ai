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

- Compares responses from Claude 3 Haiku and Claude 3 Sonnet models
- Streams responses in real-time
- Maintains conversation history for both models
- Stores responses in Supabase for analysis and tracking

## Project Structure

- `src/app/page.tsx`: Main page component with user interface
- `src/app/api/generate/route.ts`: API route for generating responses from Claude models
- `src/app/globals.css`: Global styles for the application

## Environment Variables

Make sure to set up the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `ANTHROPIC_API_KEY`: Your Anthropic API key

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)
- [Supabase Documentation](https://supabase.io/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.