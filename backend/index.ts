import express from "express";
import {tavily} from "@tavily/core"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import dotenv from "dotenv"
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";

dotenv.config()

const app = express();


const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

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
app.post("/jefplexity_ask" , async(req , res) => {
    // step 1 :  get the query from teh user 
    const query = req.body.query;
    // step 2 : make sure the user has credits/access to the endpoint 

    // step 3 : check if we have web searched index for a similar query

    // step 4 :  we do web search to gather resources 
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    });

    const webSearchResults = webSearchResponse.results
    
    // step 5 : do some context engineering on the prompt + web search response 
    const prompt = PROMPT_TEMPLATE
    .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
    .replace("{{USER_QUERY}}", query);

    // step 6 : hit the llm 

    const result = await llm.invoke([
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    // step 7 : stream back the response 
    res.write(result.content);
    res.write("\n-----------SOURCES-----------\n");


    // step 8 : also stream back the sources and the follow up questions (which we get from another parallel llm calls)
    res.write("\n<sources>\n")
    res.write(JSON.stringify(webSearchResults.map(result => ({url : result.url}))));
    res.write("\n</sources>\n");
  
    // step 9 : close the event stream 
    res.end();
})

app.post("/jefplexity_ask/follow_up" , async(req , res) => {
    // step 1 : get the existing chat from the db 

    // step 2 : Forward the full history to the llm 
    // step 2.5 :  do context engineering here.

    // step 3 : Stream the response back to the user 

})

app.listen(3000)