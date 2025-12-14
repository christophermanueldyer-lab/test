/**
 * Email Classifier using Claude API
 */

/**
 * Classify an email using Claude AI
 *
 * @param {string} sender - Email sender
 * @param {string} subject - Email subject
 * @param {string} preview - Email body preview (first 500 chars)
 * @param {boolean} isRead - Whether the email has been read
 * @return {Object} Classification result or null if failed
 */
function classifyEmail(sender, subject, preview, isRead) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in Script Properties');
    }

    // Build the classification prompt
    const prompt = buildClassificationPrompt(sender, subject, preview, isRead);

    // Call Claude API
    const response = callClaudeAPI(apiKey, prompt);

    if (!response) {
      Logger.log('Failed to get response from Claude API');
      return null;
    }

    // Parse the response
    const classification = parseClassificationResponse(response);

    return classification;

  } catch (error) {
    Logger.log(`Error in classifyEmail: ${error.toString()}`);
    return null;
  }
}

/**
 * Build the classification prompt for Claude
 */
function buildClassificationPrompt(sender, subject, preview, isRead) {
  const systemPrompt = `You are an expert email classifier. Your job is to analyze emails and determine if they should be filtered out of the inbox.

FILTER CATEGORIES (only use these exact names):
1. "Promotional Email" - Marketing emails, newsletters, sales, deals, promotions
2. "Receipt" - Purchase confirmations, order receipts, transaction confirmations
3. "Summary Email (Already Read)" - Automated digest/summary emails that have ALREADY been marked as read

IMPORTANT RULES:
- Only classify as "Summary Email (Already Read)" if the email IS_READ flag is true AND it appears to be an automated summary/digest
- If an email is a summary but NOT read yet, do NOT filter it
- Be strict about promotional emails - obvious marketing should be filtered
- Receipts are transactional confirmations (not promotional)
- When in doubt, do NOT filter (keep in inbox)

Respond ONLY with valid JSON in this exact format:
{
  "shouldFilter": true/false,
  "category": "one of the three categories above or null",
  "confidence": 0.0-1.0,
  "rationale": "brief explanation"
}`;

  const userPrompt = `Classify this email:

Sender: ${sender}
Subject: ${subject}
Is Read: ${isRead}
Preview: ${preview}

Should this email be filtered? Respond with JSON only.`;

  return { systemPrompt, userPrompt };
}

/**
 * Call Claude API
 */
function callClaudeAPI(apiKey, prompt) {
  const url = 'https://api.anthropic.com/v1/messages';

  const payload = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    system: prompt.systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt.userPrompt
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log(`Claude API error: ${responseCode} - ${response.getContentText()}`);
      return null;
    }

    const result = JSON.parse(response.getContentText());

    // Extract the text content from Claude's response
    if (result.content && result.content.length > 0) {
      return result.content[0].text;
    }

    Logger.log('Unexpected Claude API response format');
    return null;

  } catch (error) {
    Logger.log(`Error calling Claude API: ${error.toString()}`);
    return null;
  }
}

/**
 * Parse Claude's classification response
 */
function parseClassificationResponse(responseText) {
  try {
    // Claude should return pure JSON, but sometimes adds markdown code blocks
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);

    // Validate the response structure
    if (typeof result.shouldFilter !== 'boolean') {
      Logger.log('Invalid response: shouldFilter is not boolean');
      return null;
    }

    // Ensure category is valid if shouldFilter is true
    if (result.shouldFilter) {
      const validCategories = [
        'Promotional Email',
        'Receipt',
        'Summary Email (Already Read)'
      ];

      if (!validCategories.includes(result.category)) {
        Logger.log(`Invalid category: ${result.category}`);
        return null;
      }
    }

    return {
      shouldFilter: result.shouldFilter,
      category: result.category,
      confidence: result.confidence || 0,
      rationale: result.rationale || 'No rationale provided'
    };

  } catch (error) {
    Logger.log(`Error parsing classification response: ${error.toString()}`);
    Logger.log(`Response text: ${responseText}`);
    return null;
  }
}

/**
 * Test the classifier with a sample email
 */
function testClassifier() {
  // Test with a promotional email
  const result1 = classifyEmail(
    'Nike <promo@nike.com>',
    'Flash Sale: 40% Off Everything!',
    'Don\'t miss out on our biggest sale of the year. Shop now and save 40% on all items...',
    false
  );
  Logger.log('Test 1 (Promo): ' + JSON.stringify(result1));

  // Test with a receipt
  const result2 = classifyEmail(
    'Amazon <auto-confirm@amazon.com>',
    'Your Amazon.com order #123-456',
    'Order Confirmation. Thank you for your order. Your order #123-456 has been confirmed...',
    false
  );
  Logger.log('Test 2 (Receipt): ' + JSON.stringify(result2));

  // Test with a summary email that's been read
  const result3 = classifyEmail(
    'GitHub <noreply@github.com>',
    'Email Filter Summary - Dec 13, 2024',
    'FILTERED EMAILS (3 emails moved to Promos and archived): ...',
    true
  );
  Logger.log('Test 3 (Summary - Read): ' + JSON.stringify(result3));

  // Test with a summary email that's NOT been read yet
  const result4 = classifyEmail(
    'GitHub <noreply@github.com>',
    'Weekly Digest',
    'Here\'s what happened this week in your repositories...',
    false
  );
  Logger.log('Test 4 (Summary - Unread): ' + JSON.stringify(result4));
}
