/**
 * assets/js/tools/text-summarizer.js
 */
import { aiTool } from './shared/ai.js';

export const mount = aiTool({
  task: 'summarize',
  noun: 'text',
  inputLabel: 'Text to summarize',
  placeholder: 'Paste an article, report, transcript or set of meeting notes...',
  buttonLabel: 'Summarize',
  optionA: {
    label: 'Output style',
    choices: [
      ['bullets', 'Bullet key points'],
      ['paragraph', 'Short paragraph'],
      ['tldr', 'One line TL;DR'],
      ['executive', 'Executive summary'],
      ['eli5', 'Explain simply']
    ]
  },
  optionB: {
    label: 'Length',
    choices: [['short', 'Short'], ['medium', 'Medium'], ['detailed', 'Detailed']]
  }
});
