This is a demo that showcases using CopilotKit to build a simple Todo app.

## Deploy with Vercel

To deploy with Vercel, click the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCopilotKit%2Ftodo-demo&env=NEXT_PUBLIC_COPILOT_CLOUD_API_KEY&project-name=copilotkit-todo-demo&repository-name=copilotkit-todo-demo)

## Add your OpenAI API key

Add your environment variables to `.env.local` in the root of the project.

```
OPENAI_API_KEY=your-api-key
```

## Install dependencies

```bash
npm install
```

## Run the development server

```bash
npm run dev
```

## Open the demo

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## The Copilot-Specific parts of the code:

1. Notice `<CopilotKit />` and `<CopilotPopup />` in `page.tsx`

2. Notice `useCopilotReadable` in `page.tsx`

3. Notice the 2 `useCopilotAction` in `page.tsx`
