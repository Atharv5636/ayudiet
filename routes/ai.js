const express = require("express");
const router = express.Router();
const AIService = require("../services/aiService");
const Conversation = require("../models/Conversation");

// Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = new Conversation({
        userId,
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message
    });

    // Generate AI response
    const aiResponse = await AIService.generateChatResponse(conversation.messages);

    if (!aiResponse.success) {
      return res.status(500).json({ error: aiResponse.error });
    }

    // Add AI response
    conversation.messages.push({
      role: "assistant",
      content: aiResponse.response
    });

    await conversation.save();

    res.json({
      success: true,
      reply: aiResponse.response,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
