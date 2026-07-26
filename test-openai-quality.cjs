const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function run() {
  try {
    const res = await openai.images.generate({
      model: "gpt-image-2",
      prompt: "A beautiful sunset",
      n: 1,
      size: "1024x1024",
      quality: "hd"
    });
    console.log("Success with gpt-image-2 and quality");
  } catch (e) {
    console.log("Error with gpt-image-2 quality:", e.message);
  }
}
run();
