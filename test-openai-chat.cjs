const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function run() {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Say hello in JSON { \"message\": \"hello\" }" }],
      response_format: { type: "json_object" }
    });
    console.log("Success with gpt-4o json:", res.choices[0].message.content);
  } catch (e) {
    console.log("Error with gpt-4o json:", e.message);
  }
}
run();
