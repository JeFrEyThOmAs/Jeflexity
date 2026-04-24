import express from "express";
import {tavily} from "@tavily/core"
import dotenv from "dotenv"

dotenv.config()

const app = express();


const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

app.use(express.json());

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
app.post("/conversation" , async(req , res) => {
    // get the query from teh user 
    const query = req.body.query;
    //make sure the user has credits/access to the endpoint 

    //check if we have web searched index for a similar query

    // we do web search to gather resources 
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    });

    const webSearchResults = webSearchResponse.results
    

    // do some context engineering on the prompt + web search response 

    // hit the llm 

    // stream back the response 

    // also stream back the sources and the follow up questions (which we get from another parallel llm calls)

})

app.listen(3000)