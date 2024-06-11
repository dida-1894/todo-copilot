// import { OpenAIAdapter } from "@copilotkit/adapters";
// import { CopilotRuntime } from "@copilotkit/runtime";

export async function POST(req: Request): Promise<Response> {
  try {

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}