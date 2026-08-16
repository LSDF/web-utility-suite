/**
 * assets/js/tools/code-explainer.js
 */
import { aiTool } from './shared/ai.js';

export const mount = aiTool({
  task: 'explain-code',
  noun: 'code',
  inputLabel: 'Code snippet',
  placeholder: 'Paste a function, class, query or shell script...',
  buttonLabel: 'Explain this code',
  optionA: {
    label: 'Language',
    choices: [
      ['auto', 'Detect automatically'],
      ['javascript', 'JavaScript / TypeScript'], ['python', 'Python'], ['php', 'PHP'],
      ['java', 'Java'], ['csharp', 'C#'], ['cpp', 'C / C++'], ['go', 'Go'],
      ['rust', 'Rust'], ['sql', 'SQL'], ['bash', 'Bash / Shell'], ['other', 'Other']
    ]
  },
  optionB: {
    label: 'Depth',
    choices: [
      ['beginner', 'Beginner friendly'],
      ['standard', 'Standard walkthrough'],
      ['expert', 'Expert: complexity and edge cases']
    ]
  }
});
