/**
 * assets/js/tools/password-generator.js
 * Cryptographically secure passwords and diceware style passphrases.
 * Randomness always comes from crypto.getRandomValues - never Math.random.
 */
import { h, field, btn, ghost, row, checkbox, select, copy, alertBox } from '../core/dom.js';

const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
  ambiguous: 'ilLI|O0o1'
};

const WORDS = ('able acid aged also area army away baby back ball band bank base bath bear beat been bell belt bend '
 + 'best bird blue boat body bone book boot born both bowl bulk burn bush busy cake call calm came camp card care '
 + 'case cash cast cell chef chip city clay club coal coat code cold come cook cool cope copy core corn cost crew '
 + 'crop dark data date dawn days dead deal dear debt deep deny desk dial diet disc disk does done door dose down '
 + 'draw drew drop drug dual duke dust duty each earn ease east easy edge else even ever evil exit face fact fail '
 + 'fair fall farm fast fate fear feed feel feet fell felt file fill film find fine fire firm fish five flat flow '
 + 'food foot ford form fort four free from fuel full fund gain game gate gave gear gene gift girl give glad goal '
 + 'goes gold golf gone good gray grew grid grow gulf hair half hall hand hang hard harm hate have head heal hear '
 + 'heat held hell help herb here hero hide high hill hint hire hold hole holy home hope horn host hour huge hung '
 + 'hunt hurt icon idea inch into iron item jack jane join jump jury just keen keep kept kick kind king knee knew '
 + 'know lack lady laid lake land lane last late lead leaf lean left lend lens less lift like limb line link list '
 + 'live load loan lock loft logo long look loop lord lose loss lost loud love luck lung made mail main make male '
 + 'mall many mark mask mass mate math meal mean meat meet melt menu mere mesh mile milk mill mind mine mint miss '
 + 'mode mood moon more most move much must name near neat neck need news next nice nine node none noon norm nose '
 + 'note noun once only open oral oven over pace pack page paid pain pair palm park part pass past path peak pear '
 + 'peer pick pile pine pink pipe plan play plot plug plus poem poet pole poll pond pool poor port pose post pour '
 + 'pull pure push race rack rail rain rank rare rate read real rear rely rent rest rice rich ride ring rise risk '
 + 'road rock role roll roof room root rope rose rule rush safe said sail salt same sand save seal seat seed seek '
 + 'seem seen self sell send sense ship shoe shop shot show shut side sign silk site size skin slip slow snap snow '
 + 'soft soil sold sole solo some song soon sort soul soup spin spot star stay stem step stir stop such suit sure '
 + 'swim tail take tale talk tall tank tape task team tear tech tell tend tent term test text than that them then '
 + 'they thin this thus tide tidy tile till time tiny tone took tool torn tour town trap tree trim trip true tube '
 + 'tune turn twin type unit upon urge used user vary vast verb very vibe view visa void vote wage wait wake walk '
 + 'wall want ward warm wash wave weak wear week well went were west what when whom wide wife wild will wind wine '
 + 'wing wire wise wish with wolf wood wool word wore work worm worn wrap yard yarn year your zero zone zoom').split(' ');

function randomInt(max) {
  const limit = Math.floor(4294967296 / max) * max;
  const buf = new Uint32Array(1);
  let value;
  do { crypto.getRandomValues(buf); value = buf[0]; } while (value >= limit);
  return value % max;
}

function pick(alphabet) {
  return alphabet.charAt(randomInt(alphabet.length));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function crackTime(bits) {
  // 100 billion guesses/second offline attack against a fast hash
  const seconds = Math.pow(2, bits - 1) / 1e11;
  const units = [[31557600e3, 'millennia'], [31557600, 'years'], [2629800, 'months'],
                 [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds']];
  for (let i = 0; i < units.length; i += 1) {
    if (seconds >= units[i][0]) {
      const n = seconds / units[i][0];
      return (n > 1e6 ? n.toExponential(2) : n.toFixed(1)) + ' ' + units[i][1];
    }
  }
  return 'instantly';
}

export function mount(root) {
  const outputs = h('div', { class: 'space-y-2' });
  const meter   = h('div', { class: 'meter mt-3' }, h('span', {}));
  const meterText = h('p', { class: 'hint mt-1' });

  const mode   = select({}, [['chars', 'Random characters'], ['words', 'Memorable passphrase']]);
  const length = field({ type: 'number', value: 20, min: 4, max: 128 });
  const count  = field({ type: 'number', value: 5, min: 1, max: 20 });
  const sep    = field({ value: '-', maxlength: 3 });

  const useLower  = checkbox('pw-lower', 'Lowercase a-z', true);
  const useUpper  = checkbox('pw-upper', 'Uppercase A-Z', true);
  const useDigits = checkbox('pw-digits', 'Digits 0-9', true);
  const useSymbol = checkbox('pw-symbols', 'Symbols !@#', true);
  const noAmbig   = checkbox('pw-ambig', 'Avoid look-alike characters', true);
  const capWords  = checkbox('pw-caps', 'Capitalise words', true);
  const numWords  = checkbox('pw-num', 'Append a number', true);

  const charOpts = h('div', { class: 'grid gap-2 sm:grid-cols-2' }, useLower, useUpper, useDigits, useSymbol, noAmbig);
  const wordOpts = h('div', { class: 'hidden grid gap-2 sm:grid-cols-2' }, capWords, numWords);

  function alphabet() {
    let chars = '';
    if (useLower.input.checked)  chars += SETS.lower + (noAmbig.input.checked ? '' : 'l');
    if (useUpper.input.checked)  chars += SETS.upper + (noAmbig.input.checked ? '' : 'IO');
    if (useDigits.input.checked) chars += SETS.digits + (noAmbig.input.checked ? '' : '01');
    if (useSymbol.input.checked) chars += SETS.symbols;
    return chars;
  }

  function makeChars() {
    const chars = alphabet();
    if (!chars) return { value: '', bits: 0 };
    const size = Math.max(4, Number(length.value) || 16);
    const out = [];
    // guarantee at least one from each selected class
    if (useLower.input.checked)  out.push(pick(SETS.lower));
    if (useUpper.input.checked)  out.push(pick(SETS.upper));
    if (useDigits.input.checked) out.push(pick(SETS.digits));
    if (useSymbol.input.checked) out.push(pick(SETS.symbols));
    while (out.length < size) out.push(pick(chars));
    return { value: shuffle(out).slice(0, size).join(''), bits: size * Math.log2(chars.length) };
  }

  function makeWords() {
    const n = Math.max(3, Math.min(12, Number(length.value) > 12 ? 5 : Number(length.value)));
    const parts = [];
    for (let i = 0; i < n; i += 1) {
      let word = WORDS[randomInt(WORDS.length)];
      if (capWords.input.checked) word = word.charAt(0).toUpperCase() + word.slice(1);
      parts.push(word);
    }
    if (numWords.input.checked) parts.push(String(randomInt(9000) + 1000));
    const bits = n * Math.log2(WORDS.length) + (numWords.input.checked ? Math.log2(9000) : 0);
    return { value: parts.join(sep.value || '-'), bits: bits };
  }

  function generate() {
    outputs.textContent = '';
    const total = Math.max(1, Math.min(20, Number(count.value) || 1));
    let bits = 0;

    for (let i = 0; i < total; i += 1) {
      const result = mode.value === 'words' ? makeWords() : makeChars();
      bits = result.bits;
      outputs.appendChild(
        h('div', { class: 'card flex items-center gap-3' },
          h('code', { class: 'mono min-w-0 flex-1 break-all text-sm', text: result.value || 'Select at least one character set' }),
          ghost('Copy', { onclick: () => copy(result.value) })
        )
      );
    }

    const bar = meter.firstChild;
    const pct = Math.min(100, (bits / 128) * 100);
    bar.style.width = pct + '%';
    bar.style.background = bits < 50 ? '#dc2626' : bits < 75 ? '#f59e0b' : bits < 100 ? '#16a34a' : '#0ea5e9';
    meterText.textContent = 'Entropy: ' + bits.toFixed(1) + ' bits. Estimated offline cracking time: ' + crackTime(bits) + '.';
  }

  mode.addEventListener('change', () => {
    const words = mode.value === 'words';
    charOpts.classList.toggle('hidden', words);
    wordOpts.classList.toggle('hidden', !words);
    length.value = words ? 5 : 20;
    generate();
  });

  [length, count, sep].forEach((node) => node.addEventListener('input', generate));
  [useLower, useUpper, useDigits, useSymbol, noAmbig, capWords, numWords]
    .forEach((box) => box.input.addEventListener('change', generate));

  root.append(
    h('div', { class: 'grid gap-4 sm:grid-cols-3' },
      h('div', {}, h('span', { class: 'label', text: 'Mode' }), mode),
      h('div', {}, h('span', { class: 'label', text: 'Length / word count' }), length),
      h('div', {}, h('span', { class: 'label', text: 'How many' }), count)
    ),
    h('div', { class: 'mt-3 max-w-[10rem] hidden', id: 'pw-sep-wrap' }, h('span', { class: 'label', text: 'Separator' }), sep),
    h('div', { class: 'mt-4' }, charOpts, wordOpts),
    row(btn('Generate', { onclick: generate })),
    h('div', { class: 'mt-4' }, outputs, meter, meterText),
    h('div', { class: 'mt-4' }, alertBox('info',
      'Nothing here touches the network. Passwords are produced by crypto.getRandomValues inside your browser and are never logged.'))
  );

  generate();
  return () => {};
}
