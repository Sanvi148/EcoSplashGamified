const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { message, lessonData } = req.body;

    const prompt = `
You are EcoBot.

Lesson:
${lessonData.title}

Category:
${lessonData.category}

Topics:
${lessonData.topics.join(",")}

Student Question:
${message}

Answer clearly.
Use bullet points.
Give examples.
`;

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "phi3",
        prompt,
        stream: false
      }
    );

    res.json({
      answer: response.data.response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed"
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on 5000");
});