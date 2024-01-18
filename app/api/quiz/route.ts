import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { Score } from "lib/quiz";
import { getScoresArray, getSortedStyles } from "lib/utils";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

const getScoresUpdateMessage = (scores: number[]) => {
  const sortedStyles = getSortedStyles(scores);

  return `🌟 Thinking Styles Reassessed! 🌟

Your journey of self-discovery continues with fresh insights. Here's how your thinking styles now align:

${sortedStyles.join("\n")}

Embrace these insights and continue to explore the unique facets of your thought processes!`;
};

export async function POST(request: NextRequest) {
  try {
    const { scores, userId } = (await request.json()) as {
      scores: Score;
      userId: string;
    };

    await sql`INSERT INTO scores (
        user_id, 
        explore, 
        "analyze", 
        design, 
        optimize, 
        "connect", 
        nurture, 
        energize, 
        achieve
        ) VALUES (
        ${userId}, 
        ${scores.explore}, 
        ${scores.analyze}, 
        ${scores.design}, 
        ${scores.optimize}, 
        ${scores.connect}, 
        ${scores.nurture}, 
        ${scores.energize}, 
        ${scores.achieve}
    ) RETURNING *`;
    const scoresUpdate = getScoresUpdateMessage(getScoresArray(scores));
    await sql`INSERT INTO chat_messages (user_id, content, role) VALUES (${userId}, ${scoresUpdate}, 'assistant')`;

    return NextResponse.json({ message: "Scores added successfully." }, { status: 201 });
  } catch (error) {
    console.error(error);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Check if userId is not null or undefined
    if (!userId) {
      throw new Error("The user ID must be provided.");
    }

    // Query to select the latest scores row for the given user ID
    const { rows } = await sql`
      SELECT * 
      FROM scores
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    // Check if we got a result back
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No scores found for the given user ID.",
        },
        {
          status: 404,
        }
      );
    }

    // Convert decimal string values to numbers
    const convertedScores = rows.map((row) => ({
      ...row,
      explore: parseFloat(row.explore),
      design: parseFloat(row.design),
      energize: parseFloat(row.energize),
      connect: parseFloat(row.connect),
      analyze: parseFloat(row.analyze),
      optimize: parseFloat(row.optimize),
      achieve: parseFloat(row.achieve),
      nurture: parseFloat(row.nurture),
    }));

    // If you're expecting only one row (due to LIMIT 1), you can directly access the first element
    const scores = convertedScores[0];

    // Return the latest scores row
    return NextResponse.json(
      {
        message: "Latest scores retrieved successfully.",
        scores: scores,
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
