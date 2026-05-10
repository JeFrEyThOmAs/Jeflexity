
import dotenv from "dotenv";
dotenv.config({ override: true });
import cors from "cors";
import express from "express";
import { tavily } from "@tavily/core";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HUMAN_PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { prisma } from "./db"; 
import { middleware } from "./middleware";
import type { Request } from "express";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const app = express();





const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());
app.use(cors())


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", HUMAN_PROMPT_TEMPLATE],
]);

const jefplexityChain = RunnableSequence.from([
  chatPrompt,
  llm,
  new StringOutputParser(),
]);

type AuthedRequest = Request & {
  userId?: string;
};

function createConversationSlug(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "new-conversation";
}

function extractAnswerFromModelOutput(output: string) {
  const match = output.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/i);
  if (!match?.[1]) {
    return output;
  }
  return match[1].trim();
}

app.get("/test-db", async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test2@gmail.com",
        provider: "Github",
        name: "test2",
        supabaseId: "test2",
      },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});


app.get("/conversation" ,middleware , async(req, res) => {
    try {
      const userId = (req as AuthedRequest).userId;
      if (!userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { id: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      res.json({
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          slug: conversation.slug,
          lastMessage: conversation.messages[0]?.content ?? null,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
})

app.get("/conversation/:conversationId" , middleware, async(req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const rawConversationId = req.params.conversationId;

    if (!userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    if (!rawConversationId || typeof rawConversationId !== "string") {
      res.status(400).json({ message: "conversationId is required" });
      return;
    }

    const conversationId = rawConversationId;

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    res.json({
      id: conversation.id,
      title: conversation.title,
      slug: conversation.slug,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
})



app.get("/", async (req, res) => {
    try {
      const response = await client.search("latest AI trends 2026", {
        searchDepth: "advanced",
      });
  
      res.json(response); // send Tavily result to browser
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching data");
    }
});


app.post("/jefplexity_ask", middleware, async (req, res) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const query = req.body?.query;

      if (!userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      if (!query || typeof query !== "string" || !query.trim()) {
        res.status(400).json({ message: "query is required" });
        return;
      }

      const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
      });

      const webSearchResults = webSearchResponse.results;

      const modelOutput = await jefplexityChain.invoke({
        web_search_results: JSON.stringify(webSearchResults),
        user_query: query,
        conversation_suffix: "",
      });
      const assistantAnswer = extractAnswerFromModelOutput(modelOutput);

      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: query.trim().slice(0, 80),
          slug: createConversationSlug(query),
          messages: {
            create: [
              { content: query.trim(), role: "User" },
              { content: assistantAnswer, role: "Assistant" },
            ],
          },
        },
      });

      res.json({
        conversationId: conversation.id,
        answer: modelOutput,
        sources: webSearchResults.map((searchResult) => ({ url: searchResult.url })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to process query" });
    }
})

app.post("/jefplexity_ask/follow_up" , middleware, async(req , res) => {
    try {
      const userId = (req as AuthedRequest).userId;
      const conversationId = req.body?.conversationId;
      const query = req.body?.query;

      if (!userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }

      if (!conversationId || typeof conversationId !== "string") {
        res.status(400).json({ message: "conversationId is required" });
        return;
      }

      if (!query || typeof query !== "string" || !query.trim()) {
        res.status(400).json({ message: "query is required" });
        return;
      }

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        res.status(404).json({ message: "Conversation not found" });
        return;
      }

      const webSearchResponse = await client.search(query, {
        searchDepth: "advanced",
      });
      const webSearchResults = webSearchResponse.results;

      const history = conversation.messages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

      const conversation_suffix = `

## Conversation history
${history}`;

      const modelOutput = await jefplexityChain.invoke({
        web_search_results: JSON.stringify(webSearchResults),
        user_query: query,
        conversation_suffix,
      });
      const assistantAnswer = extractAnswerFromModelOutput(modelOutput);

      await prisma.messages.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: "User",
            content: query.trim(),
          },
          {
            conversationId: conversation.id,
            role: "Assistant",
            content: assistantAnswer,
          },
        ],
      });

      res.json({
        conversationId: conversation.id,
        answer: modelOutput,
        sources: webSearchResults.map((searchResult) => ({ url: searchResult.url })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to process follow up" });
    }
})

app.listen(3001)