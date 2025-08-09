// Code execution service using Piston API (more generous free tier)
export interface CodeExecutionResult {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: {
    id: number;
    description: string;
  };
  run?: {
    stdout: string;
    stderr: string;
    code: number;
  };
}

// Piston API - Free and unlimited for reasonable use
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mappings for Piston API
export const LANGUAGE_IDS = {
  javascript: 'javascript',
  python: 'python',
  java: 'java', 
  cpp: 'cpp',
  c: 'c'
};

const PISTON_VERSIONS = {
  javascript: '18.15.0',
  python: '3.10.0',
  java: '15.0.2',
  cpp: '10.2.0',
  c: '10.2.0'
};

export async function executeCode(
  code: string, 
  language: string, 
  input: string = ''
): Promise<CodeExecutionResult> {
  try {
    // Use Piston API - completely free and reliable
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        version: PISTON_VERSIONS[language as keyof typeof PISTON_VERSIONS],
        files: [
          {
            content: code
          }
        ],
        stdin: input
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Transform Piston response to our format
    return {
      run: {
        stdout: result.run?.stdout || '',
        stderr: result.run?.stderr || '',
        code: result.run?.code || 0
      }
    };
  } catch (error) {
    console.error('Code execution failed:', error);
    throw error;
  }
}

// Alternative: Local simulation for development
export function simulateCodeExecution(code: string, language: string): string {
  let simulatedOutput = '';
  
  if (language === 'python') {
    if (code.includes('for i in range(')) {
      const rangeMatch = code.match(/for\s+\w+\s+in\s+range\((\d+)\)/);
      if (rangeMatch) {
        const rangeEnd = parseInt(rangeMatch[1]);
        const outputs = [];
        for (let i = 0; i < rangeEnd; i++) {
          outputs.push(i.toString());
        }
        simulatedOutput = outputs.join('\n');
      }
    } else if (code.includes('print(')) {
      const printMatches = code.match(/print\(([^)]+)\)/g);
      if (printMatches) {
        simulatedOutput = printMatches.map(match => {
          const content = match.match(/print\(([^)]+)\)/)?.[1] || '';
          if (content.includes('"') || content.includes("'")) {
            return content.replace(/['"]/g, '');
          }
          return content;
        }).join('\n');
      }
    } else {
      simulatedOutput = 'Hello, World!';
    }
  } else if (language === 'javascript') {
    const logMatches = code.match(/console\.log\(([^)]+)\)/g);
    if (logMatches) {
      simulatedOutput = logMatches.map(match => {
        const content = match.match(/console\.log\(([^)]+)\)/)?.[1] || '';
        return content.replace(/['"]/g, '').replace(/`/g, '');
      }).join('\n');
    } else {
      simulatedOutput = 'Hello, World!';
    }
  } else if (language === 'java') {
    if (code.includes('for(') && code.includes('System.out.println')) {
      const forMatch = code.match(/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)/);
      if (forMatch) {
        const loopEnd = parseInt(forMatch[1]);
        const outputs = [];
        for (let i = 0; i < loopEnd; i++) {
          outputs.push(i.toString());
        }
        simulatedOutput = outputs.join('\n');
      }
    } else {
      const printMatches = code.match(/System\.out\.println\(([^)]+)\)/g);
      if (printMatches) {
        simulatedOutput = printMatches.map(match => {
          const content = match.match(/System\.out\.println\(([^)]+)\)/)?.[1] || '';
          return content.replace(/['"]/g, '');
        }).join('\n');
      } else {
        simulatedOutput = 'Hello, World!';
      }
    }
  } else if (language === 'cpp') {
    if (code.includes('for(') && code.includes('cout')) {
      const forMatch = code.match(/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)/);
      if (forMatch) {
        const loopEnd = parseInt(forMatch[1]);
        const outputs = [];
        for (let i = 0; i < loopEnd; i++) {
          outputs.push(i.toString());
        }
        simulatedOutput = outputs.join('\n');
      }
    } else {
      const coutMatches = code.match(/cout\s*<<([^;]+);/g);
      if (coutMatches) {
        simulatedOutput = coutMatches.map(match => {
          const content = match.match(/cout\s*<<([^;]+);/)?.[1] || '';
          return content.replace(/['"]/g, '').replace(/endl/g, '').trim();
        }).join('\n');
      } else {
        simulatedOutput = 'Hello, World!';
      }
    }
  } else if (language === 'c') {
    if (code.includes('for(') && code.includes('printf')) {
      const forMatch = code.match(/for\s*\(\s*int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)/);
      if (forMatch) {
        const loopEnd = parseInt(forMatch[1]);
        const outputs = [];
        for (let i = 0; i < loopEnd; i++) {
          outputs.push(i.toString());
        }
        simulatedOutput = outputs.join('\n');
      }
    } else {
      const printfMatches = code.match(/printf\(([^)]+)\)/g);
      if (printfMatches) {
        simulatedOutput = printfMatches.map(match => {
          const content = match.match(/printf\(([^)]+)\)/)?.[1] || '';
          return content.replace(/['"]/g, '').replace(/\\n/g, '\n');
        }).join('');
      } else {
        simulatedOutput = 'Hello, World!';
      }
    }
  }
  
  return simulatedOutput || 'No output';
}
