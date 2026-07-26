const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function run() {
  try {
    const res = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A beautiful sunset",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });
    console.log("Success with dall-e-3");
  } catch (e) {
    console.log("Error with dall-e-3:", e.message);
  }
}
run();
