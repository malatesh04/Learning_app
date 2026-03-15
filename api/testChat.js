const { openai, generateSystemPrompt } = require('./chatService');
const db = require('./db');

(async () => {
  try {
    console.log("Fetching courses from DB...");
    const courses = await db.prepare('SELECT title, category, total_duration, price FROM courses').all();
    console.log("Courses:", courses);
    
    console.log("Generating system prompt...");
    const systemPrompt = generateSystemPrompt(courses);
    
    console.log("Calling OpenAI...");
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'hello' }
      ]
    });
    
    console.log("Success! Response:", response.choices[0].message.content);
  } catch(e) {
    console.error("Test failed with error:", e);
  } finally {
    process.exit(0);
  }
})();
