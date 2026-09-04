<?php
/** Extra blog posts merged after config/pages.php */
return [
         'blog' => [
             'slug' => 'blog',
             'category' => 'Guides',
             'type' => 'page',
             'nav' => 'Blog',
             'title' => 'Shehanly Blog - Privacy-First Tools, Security & Everyday Workflows',
             'h1' => 'The Shehanly blog',
             'description' => 'Practical guides on using free online tools without leaking data, converting documents safely, generating strong passwords and working faster with developer utilities.',
             'keywords' => 'shehanly blog, private online tools, free developer tools guides, password security, pdf converter safety, jwt decoder, disposable email',
             'intro' => 'Short, practical articles from the builder of Shehanly. No fluff. Each post solves one problem and points you at the free tool that does the work.',
             'body' => [
                 ['h2' => 'Latest posts'],
                 'New writing ships here first. Every article is written to rank, to teach, and to send you back into a tool you can actually use.',
                 ['link' => ['href' => '/word-to-pdf-guide', 'text' => 'How to convert Word to PDF online without leaking the document (4 Sep 2026)']],
                 ['link' => ['href' => '/json-formatter-guide', 'text' => 'How to format and validate JSON without sending the payload (3 Sep 2026)']],
                 ['link' => ['href' => '/hash-generator-guide', 'text' => 'How to generate MD5 and SHA-256 hashes without uploading the file (2 Sep 2026)']],
                 ['link' => ['href' => '/qr-code-guide', 'text' => 'How to generate a QR code without uploading your data (1 Sep 2026)']],
                 ['link' => ['href' => '/temp-mail-guide', 'text' => 'How to use a disposable email without leaking your real inbox (31 Aug 2026)']],
                 ['link' => ['href' => '/jwt-decoder-guide', 'text' => 'How to decode a JWT in your browser without leaking the token (30 Aug 2026)']],
                 ['link' => ['href' => '/pdf-to-word-guide', 'text' => 'How to convert a PDF to Word online without leaking the file (29 Aug 2026)']],
                 ['link' => ['href' => '/strong-password-guide', 'text' => 'How to generate a strong password in your browser (27 Aug 2026)']],
                 ['link' => ['href' => '/private-online-tools-guide', 'text' => 'How to use free online tools without giving away your data (26 Aug 2026)']],
                 ['link' => ['href' => '/education-guides', 'text' => 'Education guides: Excel, Word, PowerPoint and defensive security literacy']],
                 'Want a topic covered next? Use the Contact page and say exactly what you were trying to do when a random tool site made you hesitate.'
             ],
             'faq' => [
                 ['How often is the blog updated?', 'New posts go up when there is a real problem worth solving, not on a fake daily calendar.'],
                 ['Are these posts sales pages?', 'No. The tools stay free. The writing exists to teach and to earn search traffic the honest way.'],
             ],
         ],
];
