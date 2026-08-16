/**
 * assets/js/tools/word-to-pdf.js
 */
import { converter } from './shared/converter.js';

export const mount = converter({
  source: 'docx',
  target: 'pdf',
  accept: '.doc,.docx,.odt,.rtf',
  extensions: ['.doc', '.docx', '.odt', '.rtf'],
  maxMb: 20,
  dropLabel: 'Drop a DOC, DOCX, ODT or RTF file here, or click to choose one',
  buttonLabel: 'Convert to PDF',
  outputName: 'converted.pdf',
  privacyNote: 'Conversion runs server side so fonts and pagination match on every device. The uploaded document is removed from the server as soon as the PDF has been returned.'
});
