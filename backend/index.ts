import express from "express";

const app = express();

app.get("/" , (req , res) => {
    res.send("hello world")
})
app.post("/conversation" , async(req , res) => {
    // get the query from teh user 

    //make sure the user has credits/access to the endpoint 

    //check if we have web searched index for a similar query

    // we do web search to gather resources 

    // do some context engineering on the prompt + web search response 

    // hit the llm 

    // stream back the response 

    // also stream back the sources and the follow up questions (which we get from another parallel llm calls)
    
})

app.listen(3000)