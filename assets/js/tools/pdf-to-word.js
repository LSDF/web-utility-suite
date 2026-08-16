/**
 * assets/js/tools/pdf-to-word.js
 */
import { converter } from './shared/converter.js';

export const mount = converter({
  source: 'pdf',
  target: 'docx',
  accept: '.pdf,application/pdf',
  extensions: ['.pdf'],
  maxMb: 20,
  dropLabel: 'Drop a PDF here, or click to choose a file',
  buttonLabel: 'Convert to Word',
  outputName: 'converted.docx',
  privacyNote: 'Your PDF is streamed to /api/convert.php on this domain. That PHP script adds the vendor API key server side, forwards the file, returns the result and deletes the temporary copy in a finally block.'
});
