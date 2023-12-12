import { sql } from "@vercel/postgres";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";

import { Score } from "lib/quiz";
import { NextRequest, NextResponse } from "next/server";
import config from "app.config";

export const runtime = "edge";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function createContextPrompt({
  explorer,
  analyst,
  designer,
  optimizer,
  connector,
  nurturer,
  energizer,
  achiever,
}: Score) {
  const scores = { explorer, analyst, designer, optimizer, connector, nurturer, energizer, achiever };
  // Identify the dominant thinking style based on the highest score
  const dominantStyle = (Object.keys(scores) as (keyof typeof scores)[]).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );
  return config.chatbot.prompts.chatScoresContext(dominantStyle, scores);
}

export async function POST(req: Request) {
  const json = (await req.json()) as any;
  const { messages, scores, userId } = json as any;

  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  const model = process.env.GPT_MODEL;

  if (!model) {
    return new Response("No GPT model set", {
      status: 500,
    });
  }

  const latestMessage = messages[messages.length - 1];
  const relevantMessages = messages.slice(-4);
  const contextPrompt = scores ? createContextPrompt(scores) : config.chatbot.prompts.chatContext;

  try {
    const res = await openai.createChatCompletion({
      model,
      messages: [
        {
          role: "system",
          content: contextPrompt,
        },
        ...relevantMessages,
      ],
      temperature: 0.2,
      stream: true,
      //   max_tokens: 1000,
      user: userId.toString(),
    });

    const stream = OpenAIStream(res, {
      async onCompletion(completion) {
        await sql`INSERT INTO chat_messages (user_id, content, role) VALUES (${userId}, ${latestMessage.content}, ${latestMessage.role})`;
        await sql`INSERT INTO chat_messages (user_id, content, role) VALUES (${userId}, ${completion}, 'assistant')`;
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error: any) {
    // Log the error status and headers
    console.error("Error status:", error.response?.status);
    console.error("Response headers:", [...error.response?.headers.entries()]);

    // Check for 'Retry-After' header and parse it
    const retryAfter = error.response?.headers.get("Retry-After");
    if (retryAfter) {
      const retryAfterSeconds = parseInt(retryAfter, 10);
      console.log(`Retrying after ${retryAfterSeconds} seconds.`);
      // Wait for the specified number of seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      // Consider adding logic to retry the request here
    }

    // Handle other types of errors or rethrow if not related to rate limiting
    if (!error.response || error.response.status !== 429) {
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Check if userId is not null or undefined
    if (!userId) {
      throw new Error("The user ID must be provided.");
    }

    // Query to select the latest reports row for the given user ID
    const { rows: existingMessages } = await sql`
    SELECT * FROM chat_messages 
    WHERE user_id=${userId} 
    ORDER BY created_at ASC;
`;

    // Check if we got a result back
    if (existingMessages.length === 0) {
      return NextResponse.json(
        {
          error: "No chat found for the given user ID.",
        },
        {
          status: 404,
        }
      );
    }

    // Return the latest scores row
    return NextResponse.json(
      {
        message: "Chat retrieved successfully.",
        existingMessages,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    // Return an error response
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
      },
      {
        status: 500,
      }
    );
  }
}
