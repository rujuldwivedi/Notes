import React, { useState, useCallback } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'done';
  file_path?: string;
  code_snippet?: string;
}

interface Plan {
  title: string;
  tasks: Task[];
}

const BotIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const UserIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckCircle = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const Circle = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const ClipboardIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);



const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="bg-gray-800 rounded-lg my-2 relative text-sm">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white transition-colors duration-200"
        title="Copy code"
      >
        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
      </button>
      <pre className="p-4 overflow-x-auto text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};


const TaskCard = ({ task, onToggle }: { task: Task; onToggle: (id: number) => void; }) => {
  const isDone = task.status === 'done';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 mb-3 transition-all duration-300 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-start">
        <button onClick={() => onToggle(task.id)} className="mr-4 mt-1 flex-shrink-0">
          {isDone ? <CheckCircle className="w-6 h-6 text-green-400" /> : <Circle className="w-6 h-6 text-gray-500" />}
        </button>
        <div className="flex-grow">
          <h3 className={`font-semibold text-lg ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </h3>
          <p className="text-gray-400 mt-1">{task.description}</p>
          {task.file_path && (
            <p className="text-xs text-sky-400 mt-2 font-mono">
              <span className="font-semibold text-gray-500">File: </span> {task.file_path}
            </p>
          )}
          {task.code_snippet && <CodeBlock code={task.code_snippet} />}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTask = useCallback((taskId: number) => {
    setPlan(prevPlan => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        tasks: prevPlan.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: task.status === 'todo' ? 'done' : 'todo' }
            : task
        ),
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);

    const systemPrompt = `You are an expert software architect acting as a "planning layer" for a team of AI coding agents. Your role is to take a user's feature request and break it down into a detailed, step-by-step technical plan. The plan should be clear, concise, and actionable for a coding agent to execute.

    Output a JSON object that strictly adheres to the following schema. Do not output any other text, just the JSON.
    
    The JSON schema is:
    {
      "type": "OBJECT",
      "properties": {
        "title": { "type": "STRING", "description": "A concise title for the overall feature plan." },
        "tasks": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "id": { "type": "NUMBER", "description": "A unique sequential ID for the task, starting from 1." },
              "title": { "type": "STRING", "description": "A short, actionable title for the task." },
              "description": { "type": "STRING", "description": "A detailed description of what needs to be done in this task." },
              "file_path": { "type": "STRING", "description": "Optional: The primary file path that will be created or modified in this step." },
              "code_snippet": { "type": "STRING", "description": "Optional: A short, relevant code snippet to guide the coding agent. Provide only the essential part, not the full file." },
              "status": { "type": "STRING", "enum": ["todo"], "description": "The initial status of the task, which should always be 'todo'." }
            },
            "required": ["id", "title", "description", "status"]
          }
        }
      },
      "required": ["title", "tasks"]
    }`;

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      const candidate = result.candidates?.[0];
      if (candidate && candidate.content?.parts?.[0]?.text) {
        const generatedJsonText = candidate.content.parts[0].text;
        const parsedPlan: Plan = JSON.parse(generatedJsonText);
        setPlan(parsedPlan);
      } else {
        throw new Error("Invalid response structure from AI model.");
      }

    } catch (err: any) {
      console.error("Error generating plan:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {}
        <header className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
                <BotIcon className="w-8 h-8 text-sky-400" />
                <h1 className="text-4xl font-bold">DevPlanner AI</h1>
            </div>
            <p className="text-gray-400">A simplified planning layer for AI coding agents.</p>
        </header>

        {}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <form onSubmit={handleSubmit}>
                <label htmlFor="prompt" className="block text-lg font-semibold mb-2 flex items-center gap-2">
                  <UserIcon className="w-5 h-5"/>
                  Describe the feature you want to build
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Create a real-time chat component in React with a message input and display area'"
                    className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="mt-4 w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Plan...
                        </>
                    ) : 'Generate Plan'}
                </button>
            </form>
        </div>

        {}
        <main>
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {plan && (
                <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                      <BotIcon className="w-7 h-7 text-sky-400"/> {plan.title}
                    </h2>
                    <div>
                        {plan.tasks.map(task => (
                            <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && !plan && !error && (
              <div className="text-center text-gray-500 py-12">
                <p>The generated plan will appear here.</p>
                <p>Enter a feature description above to get started.</p>
              </div>
            )}
        </main>

      </div>
    </div>
  );
}
