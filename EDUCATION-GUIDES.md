# Education Guides

This document collects two reference guides: everyday productivity software skills, and cybersecurity/OSINT literacy. The security section is written strictly as defensive, legal-use education — it does not contain exploit code or instructions for unauthorized access.

## 1. Everyday Software Skills

### Excel

- Start any formula with `=`. Basic math: `=A1+B1`, `=A1*0.2`.
- Sum a range: `=SUM(A1:A10)`.
- Conditional logic: `=IF(A1>100,"High","Low")`.
- Modern lookups: `=XLOOKUP(lookup_value, lookup_array, return_array)`.
- Flexible lookups (search left of the search column): `=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))`.
- Conditional counting/summing: `=COUNTIF(range, criteria)`, `=SUMIF(range, criteria, sum_range)` (use `COUNTIFS`/`SUMIFS` for multiple conditions).
- Text handling: `=CONCATENATE(A1," ",B1)` or `=TEXTJOIN(" ",TRUE,A1:B1)`, plus `=LEFT()`, `=RIGHT()`, `=MID()`.
- Absolute references: `$A$1` keeps a reference fixed when copied.
- Pivot tables: Insert > PivotTable, then drag fields into Rows/Columns/Values/Filters.
- Conditional formatting: Home tab, highlight cells automatically based on rules or custom formulas.
- Data validation: Data tab, restrict input (e.g., dropdown lists).

### Word

- References tab > Insert Citation to manage sources; choose a style (APA/MLA/Chicago) from the Style dropdown; References > Bibliography inserts the formatted list.
- References > Table of Contents inserts an auto-updating TOC based on heading styles (right-click > Update Field after edits).
- Use Styles (Home tab) like "Heading 1" instead of manual formatting — this is what powers the TOC and Navigation Pane.
- Footnotes/endnotes: References > Insert Footnote/Endnote.
- Cross-references: References > Cross-reference, links update automatically if content moves.
- Mail merge (Mailings tab): connect an Excel/contact list, insert merge fields like `«FirstName»`, generate one document per row.

### PowerPoint

- Animations tab: apply Entrance, Emphasis, Exit, or Motion Path effects to a selected object.
- Animation Pane: reorder effects, set start behavior (On Click / With Previous / After Previous), adjust timing.
- Triggers: make an animation fire only when a specific object is clicked.
- Slide Master (View tab): set consistent design (fonts, logo, colors) across all slides at once.
- Transitions (Transitions tab) control how a whole slide changes to the next; Morph creates smooth movement between two slides sharing similar objects.

### Other common tools

- Google Sheets: formulas work almost identically to Excel.
- Google Docs: footnotes/citations under Insert > Footnote or Tools > Citations.
- Google Slides: animations under Insert > Animation.

## 2. Cybersecurity & OSINT Literacy (Defensive, Legal-Use Education)

All content below assumes proper authorization and consent. It is written for awareness and legitimate research, not for unauthorized access to systems or people's private information.

### Kali Linux — tool categories (conceptual overview)

Kali Linux is a Linux distribution built for **authorized** penetration testing and security auditing. Its tools are organized by phase of an authorized security assessment:

- **Information gathering** (e.g., Nmap): mapping devices/services on a network you're authorized to assess.
- **Vulnerability analysis** (e.g., OpenVAS): scanning for known, publicly documented weaknesses and producing a report.
- **Password auditing** (e.g., John the Ripper, Hashcat): testing whether your own organization's password policies are strong enough.
- **Wireless auditing** (e.g., Aircrack-ng suite): checking the security configuration of a Wi-Fi network you're authorized to assess.
- **Forensics** (e.g., Autopsy): investigating a compromised machine after an incident, preserving evidence integrity.

A real engagement requires written authorization ("scope of engagement") and ends with a report of findings and remediation steps. Using these tools against systems without authorization is illegal in most jurisdictions.

### Social engineering — recognizing and defending against it

Common attack patterns:

- **Phishing / spear phishing / whaling**: fake messages impersonating a trusted source, targeted at an individual or executive.
- **Vishing / smishing**: phishing via phone call or SMS.
- **Pretexting**: attacker fabricates a believable scenario (e.g., posing as IT support) to extract information.
- **Baiting**: leaving something enticing (e.g., a labeled USB drive) hoping curiosity leads someone to use it.
- **Tailgating**: following an authorized person through a secured door without your own badge.
- **Quid pro quo**: offering something in exchange for information or access.

Defenses: verify requests through a separate/known channel, be skeptical of urgency and authority pressure, never enter credentials from a link in an unsolicited message, use multi-factor authentication, and rely on security awareness training plus least-privilege access controls.

### OSINT — legitimate research using publicly available information

- **Search operators** ("Google dorking"): `site:`, `filetype:`, `intitle:` narrow results to already-public, indexed content.
- **WHOIS / DNS lookups**: public domain registration and DNS records for a website.
- **Wayback Machine**: view a site's historical public versions.
- **Metadata/EXIF analysis**: reviewing metadata embedded in publicly shared photos (e.g., camera model); strip metadata before posting your own photos if privacy is a concern.
- **Username enumeration** (e.g., Sherlock): checking whether a username appears across public platforms, useful for verifying a profile's authenticity or auditing your own footprint.
- **Shodan**: a search engine indexing publicly internet-facing devices; useful for auditing what your own organization exposes.
- **Public records / business registries**: government-run sites for property, court, or business registration records — useful for legitimate due diligence.

**Legal/ethical boundary**: only view what is intentionally public, never bypass privacy settings or authentication, and never aggregate public data to harass, deceive, or impersonate someone.
