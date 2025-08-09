import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, code, language, problemTitle } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize the model - try different model names
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (err) {
      // Fallback to other model names
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      } catch (err2) {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      }
    }

    // Create context-aware prompt
    let prompt = '';
    
    if (code && code.trim()) {
      if (message.toLowerCase().includes('generate complete runnable code') || 
          message.toLowerCase().includes('complete code') ||
          message.toLowerCase().includes('runnable code')) {
        prompt = `Convert this ${language} code into a complete runnable program with user input functionality. IMPORTANT: Only provide the code, no explanations.

Current code:
\`\`\`${language}
${code}
\`\`\`

Requirements for the complete runnable code:
1. **SINGLE CLASS ONLY** - Do not create multiple classes or interfaces
2. **MAIN METHOD** - Include a complete main() method
3. **USER INPUT** - Add Scanner/input.nextLine() or appropriate input method for the language
4. **COMPLETE PROGRAM** - Must be ready to compile and run immediately
5. **SAME LOGIC** - Keep the exact same algorithm/logic as the original code
6. **PROPER IMPORTS** - Include all necessary import statements
7. **INPUT HANDLING** - Take input from user (not hardcoded values)
8. **OUTPUT** - Print results to console

Language-specific guidelines:
- Java: Use Scanner class for input, single public class with main method
- Python: Use input() function, no class needed just functions with main execution
- C++: Use cin for input, single main() function
- JavaScript: Use readline or process.stdin for Node.js, or prompt() for browser

CRITICAL: 
- Use ONLY ONE class/file structure
- Make it completely self-contained
- Include proper input/output handling
- Ensure it can run directly without modifications

Response format: Provide ONLY the complete code in a code block, absolutely no explanations or text outside the code block.`;
      } else {
        prompt = `You are a friendly AI programming assistant, just like Gemini, helping with coding and DSA problems.

**Current Context:**
- Problem: ${problemTitle || 'Code Editor'}
- Language: ${language || 'Unknown'}
- Code:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

**User Question:** ${message}

Please respond naturally and helpfully. You can:
- Explain code and algorithms
- Answer general programming questions
- Help with debugging and optimization
- Provide coding examples
- Have casual conversations about programming
- Answer "hi", "hello" and other greetings normally

Be friendly, conversational, and helpful like a real assistant!

Response:`;
      }
    } else {
      prompt = `You are a friendly AI programming assistant, just like Gemini, specializing in coding and DSA problems.

**User Question:** ${message}

Please respond naturally and helpfully. You can:
- Answer programming questions
- Explain algorithms and data structures
- Provide code examples
- Help with coding concepts
- Have casual conversations
- Respond to greetings normally ("hi", "hello", etc.)

Be friendly, conversational, and helpful like a real assistant!

Response:`;
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      message: text,
      success: true 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
