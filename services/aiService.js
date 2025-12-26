const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateChatResponse(messages) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // System instructions as first message, wrapped in 'parts'
      const systemPrompt = {
        role: "user", // ✅ Gemini requires first message to be 'user'
        parts: [
          {
            text: `
You are AyurBot, an advanced AI assistant for Ayurvedic practitioners.

Responsibilities:
- Deliver concise, professional, structured responses (max 4 bullets per section).
- Suggest precise Ayurvedic diet plans based on Prakriti (Vata, Pitta, Kapha) and health conditions.
- Recommend herbs with name (Latin), dose, route, contraindication in ≤1 line.
- Suggest foods to eat/avoid and meal timing strategies.
- Reference classical Ayurvedic texts only by name (Charaka Samhita, Sushruta Samhita).
- Add modern medical perspective briefly if relevant.
- Always include a one-line TL;DR at the top.
- End with a short safety disclaimer.
- Never give vague or generic suggestions.
-Give concise answer that should be crisp,clear and accurate .

Response Template:
- TL;DR:
- Condition/Patient Profile:
- Recommended Dietary Guidelines:
- Suggested Herbs and Supplements:
- Foods to Avoid:
- Classical Text References:
- Red flags / When to refer:
- Safety disclaimer:


`
          }
        ]
      };

      // Convert conversation messages to Gemini format
      const history = [
        systemPrompt,
        ...messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      ];

      // Start chat with Gemini
      const chat = model.startChat({ history });

      // Send last user message
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);

      return {
        success: true,
        response: result.response.text()
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
