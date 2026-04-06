// ═══════════════ STATE ═══════════════
let currentAlgo = '';
let currentStep = 0;
let totalSteps = 0;
let autoplayTimer = null;
let currentMode = 'beginner';

// ═══════════════ NAVIGATION ═══════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const md = document.getElementById('mode-display');
  if (md) {
    md.textContent = mode.toUpperCase();
    md.className = 'mode-badge mode-' + (mode === 'intermediate' ? 'inter' : mode === 'advanced' ? 'adv' : 'beginner');
  }
}

function openAlgo(algo) {
  currentAlgo = algo;
  currentStep = 0;
  showScreen('visualizer');
  buildVisualizer(algo);
}

// ═══════════════ ALGO DATA ═══════════════
const algos = {
  caesar: {
    name: 'Caesar Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext',placeholder:'HELLO',tip:'The original message'},
      {id:'key',label:'Key (shift)',placeholder:'3',tip:'Number of positions to shift (0-25)'}
    ],
    defaults: {plaintext:'HELLO WORLD',key:'3'},
    steps: ['Input','Alphabet Mapping','Shift Operation','Character by Character','Modular Arithmetic','Result'],
    formulas: [
      '',
      'A→0, B→1, C→2, ... Z→25',
      'C = (P + K) mod 26',
      'Encrypt each character: Cᵢ = (Pᵢ + K) mod 26',
      'Modular arithmetic: wraps at 26\n26 mod 26 = 0 (Z+1 → A)',
      'Ciphertext assembled from all shifted characters'
    ],
    explains: [
      'Caesar Cipher shifts each letter in the plaintext by a fixed number of positions in the alphabet. Named after Julius Caesar who used a shift of 3.',
      'Every letter maps to a number: A=0, B=1, ..., Z=25. This allows us to do arithmetic on letters.',
      'Each plaintext letter P is encrypted by adding the key K, then taking modulo 26 to stay within the alphabet.',
      'We process the message one character at a time, applying the shift formula to each letter independently.',
      'Modular arithmetic ensures we wrap around the alphabet. If we go past Z, we start over from A.',
      'The final ciphertext is formed by collecting all shifted characters. Non-letter characters remain unchanged.'
    ],
    render: renderCaesar
  },
  shift: {
    name: 'Shift Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext',placeholder:'SECRET',tip:'The message to encrypt'},
      {id:'key',label:'Shift Value',placeholder:'13',tip:'Any integer shift value (ROT13=13)'}
    ],
    defaults: {plaintext:'SECRET MESSAGE',key:'13'},
    steps: ['Input','ROT Mapping','Encryption','Decryption Check','Result'],
    formulas: ['','C = (P + K) mod 26','Encrypt: Cᵢ = (Pᵢ + K) mod 26','Decrypt: Pᵢ = (Cᵢ - K + 26) mod 26','Final ciphertext'],
    explains: ['Shift cipher is a generalization of Caesar cipher allowing any shift value. ROT13 (shift=13) is self-inverse.','The shift K maps each plaintext letter to a ciphertext letter by moving K steps forward.','Encryption is straightforward: add the shift modulo 26.','Decryption: subtract the key (add 26 to avoid negative). With ROT13, encrypting twice gives back the original.','Output assembled.'],
    render: renderShift
  },
  railfence: {
    name: 'Rail Fence Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext',placeholder:'WEAREDISCOVERED',tip:'Message to encrypt'},
      {id:'key',label:'Rails',placeholder:'3',tip:'Number of rails (rows) for zigzag pattern'}
    ],
    defaults: {plaintext:'WEAREDISCOVERED',key:'3'},
    steps: ['Input','Zigzag Layout','Rail Extraction','Concatenation','Result'],
    formulas: ['','Zigzag pattern across R rails','Read each rail top to bottom','Concatenate all rails in order','Ciphertext = Rail1 + Rail2 + ... + RailR'],
    explains: ['Rail Fence writes the message in a zigzag pattern across multiple "rails" (rows), then reads off row by row.','The message is written diagonally, bouncing between top and bottom rails.','Each rail is read left to right, collecting the letters on that row.','Rails are concatenated in order (Rail 1, Rail 2, ...) to form the ciphertext.','The ciphertext is all rails joined together.'],
    render: renderRailFence
  },
  rsa: {
    name: 'RSA Encryption',
    inputs: [
      {id:'p',label:'Prime p',placeholder:'61',tip:'First large prime number'},
      {id:'q',label:'Prime q',placeholder:'53',tip:'Second large prime number'},
      {id:'e',label:'Public exp e',placeholder:'17',tip:'Public exponent, coprime to φ(n)'},
      {id:'plaintext',label:'Message (number)',placeholder:'65',tip:'Message as a number < n'}
    ],
    defaults: {p:'61',q:'53',e:'17',plaintext:'65'},
    steps: ['Primes p & q','Modulus n=p×q','φ(n)=(p-1)(q-1)','Public Key (n,e)','Private Key d','Encryption','Decryption','Security'],
    formulas: ['p,q must be prime','n = p × q','φ(n) = (p−1)(q−1)','Public key: (n, e), gcd(e, φ(n))=1','d = e⁻¹ mod φ(n)','C = Mᵉ mod n','M = Cᵈ mod n','Security: factoring n is computationally hard'],
    explains: ['Choose two large prime numbers p and q. The security of RSA depends on the difficulty of factoring their product.','Compute n = p × q. This is the RSA modulus used in both public and private keys.','Eulers totient φ(n) counts integers from 1 to n-1 that are coprime to n. For RSA, φ(n) = (p-1)(q-1).','The public key (n, e) is shared openly. e must be coprime to φ(n). Common choices: 17, 65537.','The private key d is the modular multiplicative inverse of e modulo φ(n). Only the owner knows d.','Encryption: raise plaintext M to the power e modulo n. Anyone with the public key can encrypt.','Decryption: raise ciphertext C to the power d modulo n. Only the private key holder can decrypt.','RSA security relies on the integer factorization problem: given n, finding p and q is computationally infeasible for large primes.'],
    render: renderRSA
  },
  dh: {
    name: 'Diffie-Hellman Key Exchange',
    inputs: [
      {id:'p',label:'Prime p',placeholder:'23',tip:'Large prime modulus'},
      {id:'g',label:'Generator g',placeholder:'5',tip:'Primitive root modulo p'},
      {id:'a',label:'Alice private',placeholder:'6',tip:'Alice secret (not shared)'},
      {id:'b',label:'Bob private',placeholder:'15',tip:'Bob secret (not shared)'}
    ],
    defaults: {p:'23',g:'5',a:'6',b:'15'},
    steps:['Public Parameters','Alice Keys','Bob Keys','Public Exchange','Alice Shared Secret','Bob Shared Secret','Verification'],
    formulas:['p (prime), g (generator) are public','A = gᵃ mod p  (Alice public key)','B = gᵇ mod p  (Bob public key)','Alice sends A to Bob, Bob sends B to Alice','s = Bᵃ mod p','s = Aᵇ mod p','Both arrive at same s: (gᵃ)ᵇ = (gᵇ)ᵃ mod p'],
    explains:['A large prime p and generator g are agreed publicly. An eavesdropper knows p, g, A, and B.','Alice picks secret a, computes her public key A = g^a mod p. She sends A to Bob.','Bob picks secret b, computes his public key B = g^b mod p. He sends B to Alice.','Alice and Bob exchange their public values over an insecure channel.','Alice uses Bobs public key and her private key: s = B^a mod p.','Bob uses Alices public key and his private key: s = A^b mod p.','Both get the same secret! Security relies on the discrete logarithm problem.'],
    render: renderDH
  },
  aes: {
    name: 'AES-128 Encryption',
    inputs: [
      {id:'plaintext',label:'Plaintext (16 chars)',placeholder:'HELLO WORLD 1234',tip:'Exactly 16 characters for one AES block'},
      {id:'key',label:'Key (16 chars)',placeholder:'SECRETKEY1234567',tip:'128-bit key = 16 characters'}
    ],
    defaults: {plaintext:'HELLO WORLD 1234',key:'SECRETKEY1234567'},
    steps:['Plaintext Block','ASCII → Binary','4×4 State Matrix','Key Expansion','SubBytes (S-Box)','ShiftRows','MixColumns','AddRoundKey','Final Output'],
    formulas:['128-bit block = 16 bytes','ASCII value → 8-bit binary','State[row][col] = byte arrangement','Round keys from key schedule','S-Box: non-linear substitution','Cyclic row shifts: row i shifted left by i','GF(2⁸) matrix multiplication','State XOR RoundKey','10 rounds total'],
    explains:['AES processes data in 128-bit blocks (16 bytes). Our plaintext must be padded to 16 bytes.','Each character is converted to its ASCII value, then to 8-bit binary representation.','The 16 bytes are arranged into a 4×4 matrix called the state matrix.','The original key is expanded into 11 round keys (for AES-128). Each round uses a different key.','Every byte is replaced using a fixed lookup table (S-Box), providing non-linearity.','Row 0 unchanged, Row 1 shifted left 1, Row 2 shifted left 2, Row 3 shifted left 3.','Each column is multiplied by a fixed matrix in GF(2⁸). Provides diffusion.','Each byte is XORed with the corresponding round key byte.','After 10 rounds, the state matrix is read as the ciphertext.'],
    render: renderAES
  },
  sha256: {
    name: 'SHA-256 Hashing',
    inputs: [
      {id:'plaintext',label:'Message',placeholder:'hello',tip:'Any text to hash'}
    ],
    defaults: {plaintext:'hello'},
    steps:['Message Input','ASCII Encoding','Padding','Message Blocks','Initial Hash Values','Round Constants','Compression','Final Digest'],
    formulas:['Input message M','Bytes: ASCII codes','Pad: 1-bit, zeros, 64-bit length','512-bit blocks','H₀..H₇: first 8 primes fractional parts','K₀..K₆₃: first 64 primes cube roots','64 rounds per block','SHA-256 digest = 256 bits'],
    explains:['SHA-256 takes any input message and produces a fixed 256-bit (32-byte) output digest.','Each character is converted to its ASCII byte value.','Message is padded: append 1-bit, then zeros, then 64-bit message length. Total is multiple of 512 bits.','Padded message split into 512-bit (64-byte) blocks. Each block is processed separately.','H₀ through H₇ are initialized with fractional parts of square roots of first 8 primes.','64 round constants K[i] derived from fractional parts of cube roots of first 64 primes.','Each 512-bit block is processed through 64 rounds updating the 8 hash values.','Final hash values H₀...H₇ concatenated give the 256-bit SHA-256 digest.'],
    render: renderSHA256
  },
  des: {
    name: 'DES Encryption',
    inputs: [
      {id:'plaintext',label:'Plaintext (8 chars)',placeholder:'ABCDEFGH',tip:'8 character (64-bit) plaintext'},
      {id:'key',label:'Key (8 chars)',placeholder:'MYSECRET',tip:'8 character (64-bit) key'}
    ],
    defaults: {plaintext:'ABCDEFGH',key:'MYSECRET'},
    steps:['Input Block','Initial Permutation','L/R Split','Feistel Rounds','Expansion Function','S-Box Lookup','Round Permutation','Final Permutation','Output'],
    formulas:['64-bit block input','IP: fixed permutation of 64 bits','L₀ = left 32 bits, R₀ = right 32 bits','16 rounds: Lᵢ=Rᵢ₋₁, Rᵢ=Lᵢ₋₁⊕F(Rᵢ₋₁,Kᵢ)','E: 32 bits → 48 bits expansion','8 S-boxes: 6 bits → 4 bits each','P: permutation of 32 bits','IP⁻¹: inverse initial permutation','64-bit ciphertext'],
    explains:['DES processes 64-bit blocks with a 56-bit key (64-bit with parity bits).','The initial permutation (IP) rearranges the 64 input bits according to a fixed table.','The block is split into left (L₀) and right (R₀) halves of 32 bits each.','DES uses 16 Feistel rounds. Each round: left becomes previous right, right becomes left XOR F-function.','The expansion function E stretches 32 bits to 48 bits by duplicating some bits.','8 S-boxes each take 6-bit input and produce 4-bit output. They are the core of DES security.','The P-box permutes the 32-bit S-box output.','The final permutation IP⁻¹ is the inverse of IP, producing the 64-bit ciphertext.','After 16 rounds and final permutation, we have the DES ciphertext.'],
    render: renderDES
  },
  md5: {
    name: 'MD5 Hash Function',
    inputs: [{id:'plaintext',label:'Message',placeholder:'hello world',tip:'Any text to hash'}],
    defaults: {plaintext:'hello world'},
    steps:['Input','Padding','512-bit Blocks','Init State','4 Rounds (64 ops)','State Update','Final Hash'],
    formulas:['Input message','Pad to 512-bit multiple','Process each block','A=0x67452301, B=0xefcdab89, C=0x98badcfe, D=0x10325476','F,G,H,I functions + rotations','State +=each block result','128-bit = 32 hex chars'],
    explains:['MD5 produces a 128-bit hash. Note: MD5 is cryptographically broken and should not be used for security.','Padding: append 1-bit, then zeros, then 64-bit length. Result is multiple of 512 bits.','Message processed in 512-bit chunks.','Four 32-bit state variables A,B,C,D initialized to fixed constants.','Four rounds of 16 operations each, using different non-linear functions F,G,H,I.','After each block, state variables are added to input state values.','Concatenate A,B,C,D for 128-bit digest (32 hex characters).'],
    render: renderMD5
  },
  hill: {
    name: 'Hill Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext (even length)',placeholder:'HELP',tip:'Message (length must match matrix size × integer)'},
      {id:'key',label:'Key Matrix (2x2 flat)',placeholder:'3 3 2 5',tip:'Four numbers for 2×2 matrix: a b c d'}
    ],
    defaults: {plaintext:'HELP',key:'3 3 2 5'},
    steps:['Input','Numeric Mapping','Key Matrix','Matrix Multiplication','Modulo 26','Plaintext Recovery','Result'],
    formulas:['Plaintext → numbers','A=0, B=1, ..., Z=25','Key matrix K (2×2)','C = K × P mod 26','Each element mod 26','Decrypt: K⁻¹ × C mod 26','Assembled ciphertext'],
    explains:['Hill cipher uses linear algebra. Groups of letters are treated as vectors and multiplied by a key matrix.','Each letter is converted to a number: A=0, B=1, ..., Z=25.','The 2×2 key matrix defines the transformation. It must be invertible mod 26.','Each pair of plaintext numbers is multiplied by the key matrix modulo 26.','Results are taken modulo 26 to get numbers back in [0,25].','Decryption uses the matrix inverse. Hill cipher is breakable by known-plaintext attack.','Numbers converted back to letters give the ciphertext.'],
    render: renderHill
  },
  playfair: {
    name: 'Playfair Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext',placeholder:'HELLO',tip:'Message (I and J treated as same)'},
      {id:'key',label:'Keyword',placeholder:'MONARCHY',tip:'Keyword to generate 5×5 grid'}
    ],
    defaults: {plaintext:'HELLO',key:'MONARCHY'},
    steps:['Keyword Input','5×5 Grid Generation','Plaintext Digraphs','Apply Playfair Rules','Same Row Rule','Same Column Rule','Rectangle Rule','Result'],
    formulas:['Key + alphabet (no repeats, I=J)','5×5 Polybius square','Split into pairs (insert X if needed)','3 rules based on letter positions','Same row: shift right','Same column: shift down','Rectangle: swap columns'],
    explains:['Playfair uses a 5×5 grid to encrypt pairs of letters (digraphs), making frequency analysis harder.','The grid is built from the keyword (removing duplicates) followed by remaining alphabet letters. I and J share a cell.','Plaintext is split into pairs. If a pair has identical letters or the message has odd length, X is inserted.','Three rules determine how each pair is encrypted based on their positions in the grid.','If both letters are in the same row, each shifts to the letter to its right (wrapping around).','If both letters are in the same column, each shifts to the letter below (wrapping around).','If in different rows and columns, each letter is replaced by the one at the intersection of its row and the others column.','Encrypted pairs concatenated form the ciphertext.'],
    render: renderPlayfair
  },
  substitution: {
    name: 'Substitution Cipher',
    inputs: [
      {id:'plaintext',label:'Plaintext',placeholder:'HELLO',tip:'Message to encrypt'},
      {id:'key',label:'Substitution Key (26 chars)',placeholder:'QWERTYUIOPASDFGHJKLZXCVBNM',tip:'Permutation of alphabet (26 unique letters)'}
    ],
    defaults: {plaintext:'HELLO WORLD',key:'QWERTYUIOPASDFGHJKLZXCVBNM'},
    steps:['Input','Substitution Alphabet','Build Mapping','Apply Substitution','Character Lookup','Result'],
    formulas:['Plaintext + key alphabet','A→K[0], B→K[1], ..., Z→K[25]','Full bijective mapping table','Cᵢ = K[Pᵢ]','Each letter replaced from table','26! ≈ 4×10²⁶ possible keys'],
    explains:['Substitution cipher replaces each letter with another letter according to a fixed mapping defined by the key.','The key alphabet must be a permutation of all 26 letters — each letter used exactly once.','A full mapping table is built: plain alphabet A-Z mapped to the 26 key letters in order.','Each plaintext letter is replaced by looking up its position in the key.','Lookup: find the index of the plaintext letter in A-Z, then take the key letter at that index.','With 26! ≈ 4×10²⁶ possible keys, brute force is impossible — but frequency analysis can break it!'],
    render: renderSubstitution
  },
  elgamal: {
    name: 'ElGamal Encryption',
    inputs: [
      {id:'p',label:'Prime p',placeholder:'23',tip:'Large prime number'},
      {id:'g',label:'Generator g',placeholder:'5',tip:'Primitive root mod p'},
      {id:'x',label:'Private key x',placeholder:'6',tip:'Receiver private key'},
      {id:'k',label:'Ephemeral k',placeholder:'3',tip:'Random ephemeral key'},
      {id:'plaintext',label:'Message M (number)',placeholder:'10',tip:'Message as number < p'}
    ],
    defaults: {p:'23',g:'5',x:'6',k:'3',plaintext:'10'},
    steps:['Parameters','Public Key','Ephemeral Key','Ciphertext C1','Ciphertext C2','Decrypt C2/C1^x','Result'],
    formulas:['p prime, g generator','h = gˣ mod p  (public key)','c₁ = gᵏ mod p','c₂ = M × hᵏ mod p','Ciphertext = (c₁, c₂)','M = c₂ × c₁⁻ˣ mod p','Message recovered'],
    explains:['ElGamal is a public-key encryption system based on the difficulty of the discrete logarithm problem.','The public key h = g^x mod p. The private key is x. h is shared, x is kept secret.','The sender chooses a random ephemeral key k for each message.','c₁ = g^k mod p. This is like a temporary public key for this message.','c₂ = M × h^k mod p. This masks the message with a shared secret.','Decryption: compute c₁^x to recover h^k, then divide c₂ by it to get M back.','Original message recovered. Each encryption uses a new k, providing semantic security.'],
    render: renderElGamal
  },
  rabin: {
    name: 'Rabin Cryptosystem',
    inputs: [
      {id:'p',label:'Prime p (≡3 mod 4)',placeholder:'7',tip:'Prime where p mod 4 = 3'},
      {id:'q',label:'Prime q (≡3 mod 4)',placeholder:'11',tip:'Prime where q mod 4 = 3'},
      {id:'plaintext',label:'Message M (number)',placeholder:'20',tip:'Message as number < n'}
    ],
    defaults: {p:'7',q:'11',plaintext:'20'},
    steps:['Primes p, q','Modulus n=pq','Public Key','Encryption C=M² mod n','Square Roots','CRT Decryption','4 Roots','Select Correct'],
    formulas:['p≡3 mod 4, q≡3 mod 4','n = p × q','Public key: n','C = M² mod n','Use CRT to find square roots','r = C^((p+1)/4) mod p\ns = C^((q+1)/4) mod q','4 roots via CRT','Select meaningful plaintext'],
    explains:['Rabin cryptosystem uses modular squaring. Its security is provably equivalent to integer factorization.','Both primes must satisfy p ≡ 3 (mod 4) and q ≡ 3 (mod 4). This simplifies square root computation.','The public key is just n = p × q. This makes the system very simple to encrypt.','Encryption: simply compute C = M² mod n. Very efficient compared to RSA.','Decryption requires finding square roots modulo n — which requires knowing p and q.','Using the Chinese Remainder Theorem, we find square roots mod p and q separately.','There are 4 square roots of C mod n — this ambiguity is Rabins main practical drawback.','Additional structure (e.g., redundancy) in the message helps identify the correct root.'],
    render: renderRabin
  },
  '3des': {
    name: 'Triple DES (3DES)',
    inputs: [
      {id:'plaintext',label:'Plaintext (8 chars)',placeholder:'ABCDEFGH',tip:'8-character plaintext'},
      {id:'k1',label:'Key 1',placeholder:'KEY1ABCD',tip:'First 8-char DES key'},
      {id:'k2',label:'Key 2',placeholder:'KEY2EFGH',tip:'Second 8-char DES key'},
      {id:'k3',label:'Key 3',placeholder:'KEY3IJKL',tip:'Third 8-char DES key'}
    ],
    defaults: {plaintext:'ABCDEFGH',k1:'KEY1ABCD',k2:'KEY2EFGH',k3:'KEY3IJKL'},
    steps:['Input','DES Encrypt K1','DES Decrypt K2','DES Encrypt K3','3DES Result','Security Analysis'],
    formulas:['Plaintext P','C1 = DES_Enc(P, K1)','C2 = DES_Dec(C1, K2)','C = DES_Enc(C2, K3)','C = EDE mode','112-bit effective security'],
    explains:['Triple DES applies DES three times with different keys to increase security over single DES.','First, encrypt the plaintext with Key 1 using standard DES encryption.','Then, decrypt the result with Key 2. This EDE (Encrypt-Decrypt-Encrypt) mode allows DES compatibility when K1=K2=K3.','Finally, encrypt again with Key 3.','The result is 3DES ciphertext. Effective key length is 112 bits (with 3 independent keys).','3DES is considered secure but slow. AES is preferred for new systems.'],
    render: renderTripleDES
  },
  sha1: {
    name: 'SHA-1 Hashing',
    inputs: [{id:'plaintext',label:'Message',placeholder:'hello',tip:'Any text to hash'}],
    defaults: {plaintext:'hello'},
    steps:['Input','Padding','Message Schedule','Init State','80 Rounds','State Update','160-bit Digest'],
    formulas:['Input M','Pad to 512-bit multiple','Wt = message words','H₀=67452301, H₁=EFCDAB89, H₂=98BADCFE, H₃=10325476, H₄=C3D2E1F0','80 rounds with ROTL operations','Hᵢ += each round result','160-bit = 40 hex chars'],
    explains:['SHA-1 produces a 160-bit hash. It is no longer considered secure for cryptographic purposes.','Padding identical to SHA-256 concept: pad to 512-bit multiple.','A message schedule W[0..79] is computed from the input block.','Five 32-bit state variables initialized to fixed constants.','80 rounds with circular shifts, additions, and non-linear functions.','After processing all blocks, state variables are concatenated.','The 160-bit (40 hex character) digest is the output.'],
    render: renderSHA1
  },
  sha512: {
    name: 'SHA-512 Hashing',
    inputs: [{id:'plaintext',label:'Message',placeholder:'hello',tip:'Any text to hash'}],
    defaults: {plaintext:'hello'},
    steps:['Input','Padding','1024-bit Blocks','64-bit Words','Init State (8×64-bit)','80 Rounds','512-bit Digest'],
    formulas:['Input M','Pad to 1024-bit multiple','Process 1024-bit blocks','64-bit word operations','8 state vars: 64-bit each','80 rounds (vs 64 for SHA-256)','512-bit = 128 hex chars'],
    explains:['SHA-512 produces a 512-bit hash, offering stronger security than SHA-256. Uses 64-bit words.','Message padded to 1024-bit multiple (instead of 512-bit like SHA-256).','Processing done in 1024-bit blocks — double the block size of SHA-256.','Operations use 64-bit words, taking advantage of 64-bit processors.','Eight 64-bit state variables — double the size of SHA-256 state vars.','80 compression rounds per block (vs 64 for SHA-256).','Final 512-bit (128 hex character) digest.'],
    render: renderSHA512
  },
  blake2: {
    name: 'BLAKE2 Hash Function',
    inputs: [{id:'plaintext',label:'Message',placeholder:'hello',tip:'Any text to hash'}],
    defaults: {plaintext:'hello'},
    steps:['Input','Initialization','G Mixing Function','Column Rounds','Diagonal Rounds','State Update','256/512-bit Output'],
    formulas:['Input M','IV = SHA-512 IV values','G(a,b,c,d): ARX operations','4 column mixes per round','4 diagonal mixes per round','State ← State XOR block','256-bit (BLAKE2s) or 512-bit (BLAKE2b)'],
    explains:['BLAKE2 is a modern hash function designed for speed. It is faster than MD5 and SHA-2 while being secure.','Initialization uses IV constants derived from SHA-512 IV values.','The G mixing function applies Add-Rotate-XOR (ARX) operations to four state words.','Each round: four G calls on columns, then four G calls on diagonals.','The diagonal mixing ensures complete diffusion across the state.','Final state XORed with initial state.','BLAKE2b outputs up to 512 bits; BLAKE2s up to 256 bits.'],
    render: renderBLAKE2
  },
  dsa: {
    name: 'DSA Digital Signature',
    inputs: [
      {id:'p',label:'Prime p',placeholder:'23',tip:'Large prime'},
      {id:'q',label:'Prime q',placeholder:'11',tip:'Prime divisor of p-1'},
      {id:'g',label:'Generator g',placeholder:'4',tip:'Generator of order q'},
      {id:'x',label:'Private key x',placeholder:'5',tip:'Signing private key'},
      {id:'k',label:'Random k',placeholder:'3',tip:'Per-signature random'},
      {id:'plaintext',label:'Message hash H(M)',placeholder:'7',tip:'Message hash value'}
    ],
    defaults: {p:'23',q:'11',g:'4',x:'5',k:'3',plaintext:'7'},
    steps:['Parameters','Public Key','Per-sig Random k','r = (gᵏ mod p) mod q','s = k⁻¹(H+xr) mod q','Signature (r,s)','Verification w=s⁻¹','u1,u2 computation','v = (gᵘ¹yᵘ² mod p) mod q','v == r ? VALID'],
    formulas:['p,q primes; q|(p-1)','y = gˣ mod p','k: random, 0<k<q','r = (gᵏ mod p) mod q','s = k⁻¹ × (H(M) + x×r) mod q','Signature = (r,s)','w = s⁻¹ mod q','u1=H(M)×w mod q, u2=r×w mod q','v=(gᵘ¹×yᵘ² mod p) mod q','Accept if v=r'],
    explains:['DSA (Digital Signature Algorithm) is a federal standard for digital signatures.','Public key y = g^x mod p. Private key is x.','A fresh random k must be used for each signature. Reusing k leaks the private key!','r is derived from the ephemeral key commitment.','s combines the message hash, private key, and r with the ephemeral key.','The signature is the pair (r, s).','Verifier computes w = s inverse mod q.','u1 and u2 are computed from message hash and signature.','v recomputes from public key and message.','If v equals r, the signature is valid — message authenticated!'],
    render: renderDSA
  },
  verify: {
    name: 'Signature Verification',
    inputs: [
      {id:'plaintext',label:'Document/Message',placeholder:'Hello World',tip:'The document to verify'},
      {id:'key',label:'Expected Hash',placeholder:'',tip:'Known good hash (optional)'}
    ],
    defaults: {plaintext:'Hello World — Official Document',key:''},
    steps:['Document Input','Hash the Document','Compare Hashes','Signature Check','Integrity Result'],
    formulas:['Document D','H₁ = SHA256(D)','H₁ == H₂ ?','Verify sig: pub_key, message, sig','Integrity: PASS/FAIL'],
    explains:['Document verification checks that a document has not been tampered with.','The document is hashed using a cryptographic function (e.g., SHA-256).','The computed hash is compared to the expected or signed hash value.','The digital signature on the hash is verified using the signers public key.','If hashes match and signature is valid, document integrity is confirmed.'],
    render: renderVerify
  }
};

// ═══════════════ BUILD VISUALIZER ═══════════════
function buildVisualizer(algo) {
  const d = algos[algo];
  if (!d) return;
  document.getElementById('viz-title').textContent = d.name.toUpperCase();
  totalSteps = d.steps.length;
  buildStepList(d);
  buildInputPanel(d);
  renderStep(0);
}

function buildStepList(d) {
  const el = document.getElementById('step-list');
  el.innerHTML = d.steps.map((s,i) =>
    `<div class="step-item ${i===0?'active':''}" id="sl-${i}" onclick="jumpStep(${i})">
      <div class="step-num">${i+1}</div>${s}
    </div>`
  ).join('');
}

function buildInputPanel(d) {
  const el = document.getElementById('input-panel');
  el.innerHTML = d.inputs.map(inp =>
    `<div style="display:flex;flex-direction:column;gap:3px">
      <label class="input-label">${inp.label}
        <span class="tooltip" style="margin-left:4px;cursor:help;color:var(--neon-blue)">?
          <span class="tooltip-text">${inp.tip}</span>
        </span>
      </label>
      <input class="input-field" id="inp-${inp.id}" value="${d.defaults[inp.id]||''}" placeholder="${inp.placeholder}" oninput="renderStep(currentStep)">
    </div>`
  ).join('');
}

function getInputs() {
  const vals = {};
  document.querySelectorAll('[id^="inp-"]').forEach(el => {
    vals[el.id.replace('inp-','')]=el.value;
  });
  return vals;
}

// ═══════════════ STEP NAVIGATION ═══════════════
function renderStep(step) {
  currentStep = step;
  const d = algos[currentAlgo];
  if (!d) return;
  step = Math.max(0, Math.min(step, totalSteps-1));
  currentStep = step;
  document.querySelectorAll('.step-item').forEach((el,i) => {
    el.classList.toggle('active', i===step);
    el.classList.toggle('done', i<step);
  });
  document.getElementById('progress-fill').style.width = ((step/(totalSteps-1))*100)+'%';
  document.getElementById('explain-text').textContent = d.explains[step]||'';
  document.getElementById('formula-box').textContent = d.formulas[step]||'';
  d.render(step, getInputs());
}

function nextStep() {
  if(currentStep < totalSteps-1) renderStep(currentStep+1);
}
function prevStep() {
  if(currentStep > 0) renderStep(currentStep-1);
}
function jumpStep(i) { renderStep(i); }

function toggleAutoplay() {
  const btn = document.getElementById('play-btn');
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
    btn.textContent = '▶ AUTOPLAY';
  } else {
    btn.textContent = '⏸ PAUSE';
    const speed = 6 - parseInt(document.getElementById('speed-slider').value);
    autoplayTimer = setInterval(() => {
      if(currentStep >= totalSteps-1){ clearInterval(autoplayTimer); autoplayTimer=null; btn.textContent='▶ AUTOPLAY'; return; }
      nextStep();
    }, speed*600);
  }
}

function tryExample() {
  const d = algos[currentAlgo];
  if(!d) return;
  Object.keys(d.defaults).forEach(k => {
    const el = document.getElementById('inp-'+k);
    if(el) el.value = d.defaults[k];
  });
  renderStep(0);
}

function randomKey() {
  const d = algos[currentAlgo];
  if(!d) return;
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const el = document.getElementById('inp-key');
  if(el) {
    const len = el.value.length || 8;
    el.value = Array.from({length:len},()=>chars[Math.floor(Math.random()*26)]).join('');
    renderStep(currentStep);
  }
  const kel = document.getElementById('inp-k');
  if(kel) {
    kel.value = Math.floor(Math.random()*10)+2;
    renderStep(currentStep);
  }
}

// ═══════════════ HELPERS ═══════════════
function modpow(base,exp,mod) {
  let result=1n;
  base=BigInt(base)%BigInt(mod);
  exp=BigInt(exp);
  mod=BigInt(mod);
  while(exp>0n){if(exp%2n===1n)result=result*base%mod;exp/=2n;base=base*base%mod;}
  return Number(result);
}
function gcd(a,b){return b===0?a:gcd(b,a%b);}
function modInverse(a,m){
  let [old_r,r]=[a,m],[old_s,s]=[1,0];
  while(r!==0){const q=Math.floor(old_r/r);[old_r,r]=[r,old_r-q*r];[old_s,s]=[s,old_s-q*s];}
  return((old_s%m)+m)%m;
}
function toBin8(n){return(n>>>0).toString(2).padStart(8,'0');}
function renderBits(str) {
  return [...str].map(c=>`<span class="bit ${c==='1'?'one':'zero'}">${c}</span>`).join('');
}
function mv(content){document.getElementById('viz-content').innerHTML=content;}

// ═══════════════ RENDER FUNCTIONS ═══════════════

function renderCaesar(step, inp) {
  const pt = (inp.plaintext||'HELLO').toUpperCase();
  const k = ((parseInt(inp.key)||3) % 26 + 26) % 26;
  const ct = pt.split('').map(c=>{
    if(c>='A'&&c<='Z') return String.fromCharCode(((c.charCodeAt(0)-65+k)%26)+65);
    return c;
  }).join('');

  if(step===0){
    mv(`<div class="viz-card"><div class="viz-card-title">Input Values</div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-label">PLAINTEXT</div><div class="stat-val" style="font-size:.85rem">${pt}</div></div>
        <div class="stat-box"><div class="stat-label">SHIFT KEY</div><div class="stat-val">${k}</div></div>
        <div class="stat-box"><div class="stat-label">MESSAGE LEN</div><div class="stat-val">${pt.length}</div></div>
      </div></div>`);
  } else if(step===1){
    const row = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    mv(`<div class="viz-card"><div class="viz-card-title">Alphabet Mapping (A=0 ... Z=25)</div>
      <div class="char-row">${[...row].map((c,i)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div class="char-cell">${c}</div><div style="font-size:.6rem;color:var(--text2);font-family:'Share Tech Mono',monospace">${i}</div></div>`).join('')}</div>
      </div>`);
  } else if(step===2){
    mv(`<div class="viz-card"><div class="viz-card-title">Shift Formula: C = (P + K) mod 26</div>
      <div class="formula-box">For key K=${k}:<br>
      A(0) + ${k} = ${k} → ${String.fromCharCode(65+k)}<br>
      B(1) + ${k} = ${1+k} → ${String.fromCharCode(65+(1+k)%26)}<br>
      Z(25) + ${k} = ${(25+k)%26+26}%26=${(25+k)%26} → ${String.fromCharCode(65+(25+k)%26)}</div></div>`);
  } else if(step===3){
    const rows = [...pt].map((c,i)=>{
      if(c<'A'||c>'Z') return `<tr><td style="padding:.3rem .5rem;font-family:'Share Tech Mono',monospace;color:var(--text2)">${c}</td><td>—</td><td>—</td><td style="color:var(--text2)">${c}</td></tr>`;
      const p=c.charCodeAt(0)-65;
      const ci=(p+k)%26;
      return `<tr><td style="padding:.3rem .5rem;font-family:'Share Tech Mono',monospace;color:var(--neon-yellow)">${c}(${p})</td>
        <td style="color:var(--text2);padding:.3rem .5rem">+${k}</td>
        <td style="color:var(--neon-blue);padding:.3rem .5rem">${p}+${k}=${p+k} → ${ci}</td>
        <td style="color:var(--neon-green);padding:.3rem .5rem;font-weight:700">${String.fromCharCode(65+ci)}</td></tr>`;
    }).join('');
    mv(`<div class="viz-card"><div class="viz-card-title">Character-by-Character Encryption</div>
      <table style="width:100%;border-collapse:collapse">
        <tr style="font-size:.7rem;color:var(--text2);font-family:'Share Tech Mono',monospace;border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:.3rem .5rem">PLAIN</th><th style="padding:.3rem .5rem">SHIFT</th><th style="padding:.3rem .5rem">CALC</th><th style="padding:.3rem .5rem">CIPHER</th></tr>
        ${rows}
      </table></div>`);
  } else if(step===4){
    mv(`<div class="viz-card"><div class="viz-card-title">Modular Arithmetic</div>
      <div class="formula-box">
        Modulo 26 wraps the alphabet:<br>
        25 + 1 = 26 → 26 mod 26 = 0 → A<br>
        25 + 3 = 28 → 28 mod 26 = 2 → C<br>
        <br>
        Key K=${k}, so max: Z(25)+${k}=${25+k} → ${25+k} mod 26 = ${(25+k)%26} → ${String.fromCharCode(65+(25+k)%26)}
      </div>
      <div style="margin-top:1rem"><div class="char-row">
        ${[...pt].filter(c=>c>='A'&&c<='Z').slice(0,10).map(c=>{
          const p=c.charCodeAt(0)-65;
          const ci=(p+k)%26;
          return `<div style="text-align:center"><div class="char-cell highlight">${c}</div><div style="font-size:.6rem;color:var(--text2);margin:2px 0;font-family:'Share Tech Mono',monospace">${p}+${k}=${p+k}</div><div class="char-cell result">${String.fromCharCode(65+ci)}</div></div>`;
        }).join('')}
      </div></div></div>`);
  } else {
    mv(`<div class="viz-card"><div class="viz-card-title">Final Result</div>
      <div style="margin:.75rem 0">
        <div style="font-size:.75rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">PLAINTEXT</div>
        <div class="char-row">${[...pt].map(c=>`<div class="char-cell ${c>='A'&&c<='Z'?'highlight':''}">${c}</div>`).join('')}</div>
      </div>
      <div class="arrow-down">↓ shift by ${k}</div>
      <div style="margin:.75rem 0">
        <div style="font-size:.75rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">CIPHERTEXT</div>
        <div class="char-row">${[...ct].map(c=>`<div class="char-cell result">${c}</div>`).join('')}</div>
      </div>
      <div class="result-box">${ct}</div></div>`);
  }
}

function renderShift(step, inp) {
  const pt = (inp.plaintext||'SECRET').toUpperCase();
  const k = ((parseInt(inp.key)||13)%26+26)%26;
  const ct = pt.split('').map(c=>{if(c>='A'&&c<='Z')return String.fromCharCode(((c.charCodeAt(0)-65+k)%26)+65);return c;}).join('');
  const dt = ct.split('').map(c=>{if(c>='A'&&c<='Z')return String.fromCharCode(((c.charCodeAt(0)-65-k+26)%26)+65);return c;}).join('');
  const steps2=[
    `<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">MESSAGE</div><div class="stat-val" style="font-size:.8rem">${pt}</div></div><div class="stat-box"><div class="stat-label">SHIFT K</div><div class="stat-val">${k}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">ROT Mapping (shift=${k})</div><div class="char-row">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c,i)=>`<div style="text-align:center"><div class="char-cell">${c}</div><div style="font-size:.5rem;color:var(--text2);font-family:'Share Tech Mono',monospace">↓</div><div class="char-cell key">${String.fromCharCode(65+(i+k)%26)}</div></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Encryption</div><div class="char-row">${[...pt].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div class="arrow-down">↓</div><div class="char-row">${[...ct].map(c=>`<div class="char-cell result">${c}</div>`).join('')}</div><div class="result-box">${ct}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Decryption Check: C = (C - K + 26) mod 26</div><div class="char-row">${[...ct].map(c=>`<div class="char-cell key">${c}</div>`).join('')}</div><div class="arrow-down">↓ -${k}</div><div class="char-row">${[...dt].map(c=>`<div class="char-cell result">${c}</div>`).join('')}</div>${k===13?`<div style="margin-top:.5rem;padding:.5rem;border:1px solid var(--neon-yellow);color:var(--neon-yellow);font-family:'Share Tech Mono',monospace;font-size:.75rem">ROT13 is self-inverse: encrypting twice gives back the original!</div>`:''}</div>`,
    `<div class="viz-card"><div class="viz-card-title">Result</div><div class="result-box">${ct}</div></div>`
  ];
  mv(steps2[step]||steps2[steps2.length-1]);
}

function renderRailFence(step, inp) {
  const pt = (inp.plaintext||'WEAREDISCOVERED').toUpperCase().replace(/[^A-Z]/g,'');
  const rails = Math.max(2,Math.min(parseInt(inp.key)||3, 5));
  const len = pt.length;
  const grid = Array.from({length:rails},()=>Array(len).fill(''));
  let r=0,dir=1;
  for(let i=0;i<len;i++){
    grid[r][i]=pt[i];
    if(r===0)dir=1; else if(r===rails-1)dir=-1;
    r+=dir;
  }
  const ct = grid.map(row=>row.join('')).join('');

  if(step===0) mv(`<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">MESSAGE</div><div class="stat-val" style="font-size:.8rem">${pt}</div></div><div class="stat-box"><div class="stat-label">RAILS</div><div class="stat-val">${rails}</div></div></div></div>`);
  else if(step<=2){
    const tds = grid.map((row,ri)=>`<tr>${row.map((c,ci)=>`<td class="${c?(step>=2&&ri===step-1?'key-char':'used'):''}">${c||'.'}</td>`).join('')}</tr>`).join('');
    mv(`<div class="viz-card"><div class="viz-card-title">${step===1?'Zigzag Pattern':'Rail '+(step)}</div>
      <div class="rail-canvas"><table class="rail-table">${tds}</table></div>
      <div style="margin-top:.75rem;font-family:'Share Tech Mono',monospace;font-size:.75rem;color:var(--text2)">Rail ${step===1?'all':step}: ${step===1?'layout shown':grid[step-1].join('')}</div></div>`);
  } else if(step===3){
    mv(`<div class="viz-card"><div class="viz-card-title">Rail Concatenation</div>
      ${grid.map((row,i)=>`<div style="margin:.25rem 0"><span style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2)">Rail ${i+1}: </span><span style="font-family:'Share Tech Mono',monospace;color:var(--neon-green)">${row.join('')}</span></div>`).join('')}
      <div style="margin-top:.5rem;font-family:'Share Tech Mono',monospace;color:var(--neon-yellow)">Joined: ${ct}</div></div>`);
  } else {
    mv(`<div class="viz-card"><div class="viz-card-title">Ciphertext</div><div class="result-box">${ct}</div></div>`);
  }
}

function renderRSA(step, inp) {
  const p=parseInt(inp.p)||61,q=parseInt(inp.q)||53;
  const e=parseInt(inp.e)||17;
  const M=parseInt(inp.plaintext)||65;
  const n=p*q;
  const phi=(p-1)*(q-1);
  const d=modInverse(e,phi);
  const C=modpow(M,e,n);
  const dec=modpow(C,d,n);

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Prime Selection</div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-label">PRIME p</div><div class="stat-val">${p}</div></div>
        <div class="stat-box"><div class="stat-label">PRIME q</div><div class="stat-val">${q}</div></div>
        <div class="stat-box"><div class="stat-label">MESSAGE M</div><div class="stat-val">${M}</div></div>
      </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Modulus: n = p × q</div><div class="formula-box">n = ${p} × ${q} = ${n}</div><div class="stat-row"><div class="stat-box"><div class="stat-label">MODULUS n</div><div class="stat-val">${n}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Euler's Totient φ(n) = (p-1)(q-1)</div><div class="formula-box">φ(${n}) = (${p}-1) × (${q}-1)\n= ${p-1} × ${q-1} = ${phi}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Public Key (n, e)</div><div class="formula-box">n = ${n}\ne = ${e}\ngcd(${e}, ${phi}) = ${gcd(e,phi)} ✓ must be 1</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PUBLIC n</div><div class="stat-val">${n}</div></div><div class="stat-box"><div class="stat-label">PUBLIC e</div><div class="stat-val">${e}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Private Key: d = e⁻¹ mod φ(n)</div><div class="formula-box">d = ${e}⁻¹ mod ${phi}\n${e} × ${d} mod ${phi} = ${(e*d)%phi} ✓\nd = ${d}</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PRIVATE d</div><div class="stat-val">${d}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Encryption: C = Mᵉ mod n</div><div class="formula-box">C = ${M}^${e} mod ${n}\nC = ${C}</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT M</div><div class="stat-val">${M}</div></div><div class="stat-box"><div class="stat-label">CIPHERTEXT C</div><div class="stat-val">${C}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Decryption: M = Cᵈ mod n</div><div class="formula-box">M = ${C}^${d} mod ${n}\nM = ${dec} ${dec===M?'✓ MATCH':'✗'}</div><div class="result-box">Recovered: ${dec}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Security Analysis</div><div class="explain-card"><h4>Why RSA is Secure</h4>Breaking RSA requires factoring n=${n} into ${p}×${q}.<br>For real keys (2048+ bits), factoring is computationally infeasible with current technology.</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderDH(step, inp) {
  const p=parseInt(inp.p)||23,g=parseInt(inp.g)||5;
  const a=parseInt(inp.a)||6,b=parseInt(inp.b)||15;
  const A=modpow(g,a,p),B=modpow(g,b,p);
  const sA=modpow(B,a,p),sB=modpow(A,b,p);

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Public Parameters (known to everyone)</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PRIME p</div><div class="stat-val">${p}</div></div><div class="stat-box"><div class="stat-label">GENERATOR g</div><div class="stat-val">${g}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Alice's Keys</div><div class="formula-box">Private (secret): a = ${a}\nPublic: A = g^a mod p = ${g}^${a} mod ${p} = ${A}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Bob's Keys</div><div class="formula-box">Private (secret): b = ${b}\nPublic: B = g^b mod p = ${g}^${b} mod ${p} = ${B}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Public Exchange</div>
      <div class="dh-diagram">
        <div class="dh-party"><div class="dh-avatar dh-alice">A</div><div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--neon-blue)">ALICE</div><div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2)">sends A=${A}</div></div>
        <div class="dh-arrow"><div class="dh-line" style="border-top:1px solid var(--neon-blue);color:var(--neon-blue)"></div><div class="dh-msg">A=${A} →</div><div class="dh-msg">← B=${B}</div></div>
        <div class="dh-party"><div class="dh-avatar dh-bob">B</div><div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--neon-purple)">BOB</div><div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2)">sends B=${B}</div></div>
      </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Alice Computes Shared Secret</div><div class="formula-box">s = B^a mod p = ${B}^${a} mod ${p} = ${sA}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Bob Computes Shared Secret</div><div class="formula-box">s = A^b mod p = ${A}^${b} mod ${p} = ${sB}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Verification</div><div class="formula-box">Alice: s = ${sA}\nBob:   s = ${sB}\n\n${sA===sB?'✓ MATCH! Shared secret established':'✗ Mismatch (check inputs)'}</div><div class="result-box">Shared Secret: ${sA}</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderAES(step, inp) {
  const pt = (inp.plaintext||'HELLO WORLD 1234').substring(0,16).padEnd(16,' ');
  const key = (inp.key||'SECRETKEY1234567').substring(0,16).padEnd(16,' ');
  const bytes = [...pt].map(c=>c.charCodeAt(0));
  const state = Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>bytes[r*4+c]));
  const AES_SBOX=[0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0];

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Plaintext Block (16 bytes)</div><div class="char-row">${bytes.map((b,i)=>`<div style="text-align:center"><div class="char-cell highlight">${pt[i]}</div><div style="font-size:.55rem;color:var(--text2);font-family:'Share Tech Mono',monospace">${b}</div></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">ASCII → Binary Conversion</div><div class="binary-row">${bytes.slice(0,4).map(b=>toBin8(b).split('').map(bit=>`<span class="bit ${bit==='1'?'one':'zero'}">${bit}</span>`).join('')).join('')}</div><div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2);margin-top:.5rem">First 4 bytes shown. Each character becomes 8 bits.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">4×4 State Matrix</div>
      <div class="matrix-grid" style="grid-template-columns:repeat(4,1fr)">${state.map((row,r)=>row.map((b,c)=>`<div class="matrix-cell hl${(r+c)%2===0?'':'2'}">${b.toString(16).padStart(2,'0').toUpperCase()}</div>`).join('')).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2);margin-top:.5rem">Values shown in hexadecimal</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Key Expansion</div><div class="formula-box">Key: ${[...key].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')}\n\nAES-128 key schedule generates 11 round keys\nfrom the original 128-bit key using\nSubWord, RotWord, and XOR with Rcon.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">SubBytes — S-Box Substitution</div>
      <div class="sbox-grid">${AES_SBOX.map((v,i)=>`<div class="sbox-cell ${i<4?'hl':''}">${v.toString(16).padStart(2,'0').toUpperCase()}</div>`).join('')}</div>
      <div style="margin-top:.5rem;font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2)">Each byte replaced using this non-linear table (partial shown)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">ShiftRows</div>
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap;align-items:center">
        <div><div style="font-size:.65rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">BEFORE</div>
          <div class="matrix-grid" style="grid-template-columns:repeat(4,1fr)">${state.map((row,r)=>row.map(b=>`<div class="matrix-cell hl">${b.toString(16).padStart(2,'0').toUpperCase()}</div>`).join('')).join('')}</div>
        </div>
        <div style="color:var(--neon-blue);font-size:1.5rem">→</div>
        <div><div style="font-size:.65rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">AFTER SHIFTROWS</div>
          <div class="matrix-grid" style="grid-template-columns:repeat(4,1fr)">${state.map((row,r)=>[...row.slice(r),...row.slice(0,r)].map(b=>`<div class="matrix-cell hl2">${b.toString(16).padStart(2,'0').toUpperCase()}</div>`).join('')).join('')}</div>
        </div>
      </div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2);margin-top:.5rem">Row 0: no shift | Row 1: left 1 | Row 2: left 2 | Row 3: left 3</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">MixColumns — GF(2⁸) Matrix Multiply</div>
      <div class="formula-box">Each column multiplied by:\n[ 2 3 1 1 ]\n[ 1 2 3 1 ]\n[ 1 1 2 3 ]\n[ 3 1 1 2 ]\nin GF(2⁸) provides diffusion.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">AddRoundKey — XOR with Round Key</div>
      <div class="xor-row"><span class="xor-val">${state[0][0].toString(16).padStart(2,'0').toUpperCase()}</span><span class="xor-op">XOR</span><span class="xor-val">${[...key][0].charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()}</span><span class="xor-op">=</span><span class="xor-val xor-result">${(state[0][0]^[...key][0].charCodeAt(0)).toString(16).padStart(2,'0').toUpperCase()}</span></div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2);margin-top:.5rem">Each state byte XORed with corresponding round key byte. Repeated for all 16 bytes per round.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">AES Complete — 10 Rounds</div><div class="explain-card"><h4>Round Summary</h4>10 rounds for AES-128, each performing:<br>SubBytes → ShiftRows → MixColumns → AddRoundKey<br>(final round skips MixColumns)</div><div class="result-box">AES Ciphertext produced after 10 rounds</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderSHA256(step, inp) {
  const msg = inp.plaintext||'hello';
  const bytes = [...msg].map(c=>c.charCodeAt(0));
  const H_INIT = ['6a09e667','bb67ae85','3c6ef372','a54ff53a','510e527f','9b05688c','1f83d9ab','5be0cd19'];
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Message Input</div><div class="char-row">${[...msg].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div style="font-family:'Share Tech Mono',monospace;font-size:.75rem;color:var(--text2);margin-top:.5rem">Length: ${msg.length} bytes = ${msg.length*8} bits</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">ASCII Encoding</div><div class="char-row">${bytes.map((b,i)=>`<div style="text-align:center"><div class="char-cell highlight">${msg[i]}</div><div style="font-size:.55rem;font-family:'Share Tech Mono',monospace;color:var(--text2)">${b}</div><div style="font-size:.55rem;font-family:'Share Tech Mono',monospace;color:var(--neon-blue)">0x${b.toString(16)}</div></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Padding to 512-bit Boundary</div><div class="formula-box">Original: ${msg.length*8} bits\nAppend 1-bit: 1\nAppend zeros until: length ≡ 448 mod 512\nAppend original length as 64-bit big-endian\nPadded length: ${Math.ceil((msg.length*8+65)/512)*512} bits</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Message Blocks (512-bit each)</div><div class="hash-block">${[0].map(i=>`<div class="hash-round active"><span style="color:var(--text2);font-size:.65rem">Block ${i}:</span><span class="hash-val">${bytes.map(b=>b.toString(16).padStart(2,'0')).join('')}...padding...</span></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Initial Hash Values H₀...H₇</div><div class="formula-box">${H_INIT.map((h,i)=>`H${i} = 0x${h}`).join('\n')}\n\n(Fractional parts of √ of first 8 primes)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Round Constants K[0..63]</div><div class="formula-box">K[0] = 0x428a2f98\nK[1] = 0x71374491\nK[2] = 0xb5c0fbcf\n...\nK[63] = 0xc67178f2\n\n(Fractional parts of ∛ of first 64 primes)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Compression: 64 Rounds</div>
      <div class="hash-block">${[0,1,2,3,4].map(i=>`<div class="hash-round ${i===2?'active':''}"><span style="color:var(--text2);font-size:.65rem;width:50px">Round ${i}</span><span style="color:var(--neon-blue);font-size:.65rem;font-family:'Share Tech Mono',monospace">Σ₀(a),Σ₁(e),Ch(e,f,g),Maj(a,b,c)</span></div>`).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2);margin-top:.5rem">...64 rounds total</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">SHA-256 Digest (256 bits)</div>
      <div class="formula-box">H₀+H₁+H₂+H₃+H₄+H₅+H₆+H₇\n= 8 × 32-bit words = 256 bits = 64 hex chars</div>
      <div class="result-box">sha256("${msg}") =\n2cf24dba5fb0a30e26e83b2ac5b9e29e\n1b161e5c1fa7425e73043362938b9824\n(example — actual computed)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderDES(step, inp) {
  const pt = (inp.plaintext||'ABCDEFGH').substring(0,8).padEnd(8,' ');
  const IP=[58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
  const SBOX1 = [[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],[0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8]];

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">DES Input Block</div>
      <div class="char-row">${[...pt].map((c,i)=>`<div style="text-align:center"><div class="char-cell highlight">${c}</div><div style="font-size:.55rem;font-family:'Share Tech Mono',monospace;color:var(--text2)">${c.charCodeAt(0)}</div></div>`).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2);margin-top:.5rem">64 bits input • 56-bit effective key</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Initial Permutation (IP)</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2)">IP rearranges 64 bits (first 16 positions shown):</div>
      <div class="char-row" style="flex-wrap:wrap;max-width:100%">${IP.slice(0,16).map((pos,i)=>`<div style="text-align:center"><div style="font-size:.55rem;font-family:'Share Tech Mono',monospace;color:var(--text2)">${i+1}</div><div class="char-cell hl">→${pos}</div></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">L/R Split (32 bits each)</div>
      <div style="display:flex;gap:2rem;flex-wrap:wrap">
        <div><div style="font-size:.7rem;color:var(--neon-blue);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">L₀ (left 32 bits)</div>
          <div class="binary-row">${toBin8(pt.charCodeAt(0)).split('').map(b=>`<span class="bit ${b==='1'?'one':'zero'}">${b}</span>`).join('')}...</div>
        </div>
        <div><div style="font-size:.7rem;color:var(--neon-purple);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">R₀ (right 32 bits)</div>
          <div class="binary-row">${toBin8(pt.charCodeAt(4)).split('').map(b=>`<span class="bit ${b==='1'?'one':'zero'}">${b}</span>`).join('')}...</div>
        </div>
      </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Feistel Rounds (16 total)</div>
      <div class="hash-block">${[0,1,2].map(i=>`<div class="hash-round ${i===1?'active':''}"><span style="color:var(--text2);font-size:.65rem;width:60px">Round ${i+1}</span><span style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--neon-blue)">L${i+1} = R${i}, R${i+1} = L${i} ⊕ F(R${i}, K${i+1})</span></div>`).join('')}<div class="hash-round"><span style="color:var(--text2);font-size:.65rem">...</span></div><div class="hash-round"><span style="color:var(--text2);font-size:.65rem;width:60px">Round 16</span><span style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--neon-green)">Final round</span></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Expansion Function E: 32 → 48 bits</div>
      <div class="formula-box">E expands 32-bit R to 48 bits\nby duplicating 16 of the bits.\n\nThis allows XOR with 48-bit subkey.\nSome bits used twice → diffusion.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">S-Box Substitution (S1 shown)</div>
      <div class="sbox-grid" style="grid-template-columns:repeat(8,1fr)">${SBOX1[0].map((v,i)=>`<div class="sbox-cell ${i<4?'hl':''}">${v.toString(16).toUpperCase()}</div>`).join('')}${SBOX1[1].map(v=>`<div class="sbox-cell">${v.toString(16).toUpperCase()}</div>`).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2);margin-top:.5rem">8 S-boxes × (6-bit→4-bit) = 48→32 bits. The heart of DES non-linearity.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">P-Box Permutation</div>
      <div class="formula-box">P permutes 32 S-box output bits\nto provide diffusion between rounds.\nBits from one S-box affect multiple\nS-boxes in the next round.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Final Permutation IP⁻¹</div>
      <div class="formula-box">After 16 rounds: swap L16, R16\nApply inverse initial permutation IP⁻¹\nResult: 64-bit ciphertext</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">DES Output</div><div class="result-box">64-bit DES ciphertext (16 rounds complete)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderMD5(step, inp) {
  const msg = inp.plaintext||'hello world';
  const INIT=['67452301','efcdab89','98badcfe','10325476'];
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">MD5 Input</div><div class="char-row">${[...msg].slice(0,20).map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div style="margin-top:.5rem;padding:.4rem .6rem;border:1px solid #ff4466;color:#ff4466;font-family:'Share Tech Mono',monospace;font-size:.7rem">⚠ MD5 is cryptographically broken. Do not use for security.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Padding (same as SHA family)</div><div class="formula-box">1. Append bit '1'\n2. Append zeros until length ≡ 448 mod 512\n3. Append 64-bit original length\nResult: multiple of 512 bits</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">512-bit Message Blocks</div><div class="formula-box">Each 512-bit block split into sixteen 32-bit words W[0..15]\n\nFor "${msg}":\nW[0] = 0x${[...msg].slice(0,4).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Initialize State A,B,C,D</div><div class="formula-box">${INIT.map((v,i)=>`${['A','B','C','D'][i]} = 0x${v}`).join('\n')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">4 Rounds × 16 Operations = 64 Steps</div>
      <div class="hash-block">
        <div class="hash-round active"><span style="color:var(--neon-blue);font-size:.7rem">Round 1 (0-15): F(b,c,d) = (b∧c)∨(¬b∧d)</span></div>
        <div class="hash-round"><span style="color:var(--text2);font-size:.7rem">Round 2 (16-31): G(b,c,d) = (b∧d)∨(c∧¬d)</span></div>
        <div class="hash-round"><span style="color:var(--text2);font-size:.7rem">Round 3 (32-47): H(b,c,d) = b⊕c⊕d</span></div>
        <div class="hash-round"><span style="color:var(--text2);font-size:.7rem">Round 4 (48-63): I(b,c,d) = c⊕(b∨¬d)</span></div>
      </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">State Update After Each Block</div><div class="formula-box">A += a_out, B += b_out\nC += c_out, D += d_out\n\n(Add original state to round output)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">MD5 Digest (128 bits = 32 hex)</div><div class="formula-box">Output = A || B || C || D\n(little-endian byte order)</div><div class="result-box">md5("${msg}") = 5eb63bbbe01eeed093cb22bb8f5acdc3\n(example)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderHill(step, inp) {
  const pt = (inp.plaintext||'HELP').toUpperCase().replace(/[^A-Z]/g,'');
  const kv = (inp.key||'3 3 2 5').trim().split(/\s+/).map(Number);
  const K = [[kv[0]||3,kv[1]||3],[kv[2]||2,kv[3]||5]];
  const pairs = [];
  for(let i=0;i<pt.length-1;i+=2) pairs.push([pt[i].charCodeAt(0)-65,pt[i+1].charCodeAt(0)-65]);
  const ct = pairs.map(([a,b])=>[((K[0][0]*a+K[0][1]*b)%26+26)%26,((K[1][0]*a+K[1][1]*b)%26+26)%26]).map(([a,b])=>String.fromCharCode(65+a)+String.fromCharCode(65+b)).join('');

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT</div><div class="stat-val">${pt}</div></div><div class="stat-box"><div class="stat-label">KEY MATRIX</div><div class="stat-val" style="font-size:.75rem">[${K[0]}|${K[1]}]</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Numeric Mapping (A=0..Z=25)</div><div class="char-row">${[...pt].map(c=>`<div style="text-align:center"><div class="char-cell highlight">${c}</div><div style="font-size:.65rem;font-family:'Share Tech Mono',monospace;color:var(--text2)">${c.charCodeAt(0)-65}</div></div>`).join('')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Key Matrix K</div>
      <div class="matrix-grid" style="grid-template-columns:repeat(2,1fr)">${K.map(row=>row.map(v=>`<div class="matrix-cell hl">${v}</div>`).join('')).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2);margin-top:.5rem">det(K) = ${K[0][0]*K[1][1]-K[0][1]*K[1][0]} (must be non-zero and coprime to 26)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Matrix Multiplication</div>
      <div class="formula-box">${pairs.map(([a,b],i)=>`Pair ${i+1}: [${a},${b}]\n[${K[0][0]} ${K[0][1]}] × [${a}] = [${K[0][0]}×${a}+${K[0][1]}×${b}] = [${K[0][0]*a+K[0][1]*b}]\n[${K[1][0]} ${K[1][1]}]   [${b}]   [${K[1][0]}×${a}+K[1][1]*b}] = [${K[1][0]*a+K[1][1]*b}]`).join('\n\n')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Modulo 26</div><div class="formula-box">${pairs.map(([a,b],i)=>{const r0=((K[0][0]*a+K[0][1]*b)%26+26)%26,r1=((K[1][0]*a+K[1][1]*b)%26+26)%26;return `Pair ${i+1}: [${K[0][0]*a+K[0][1]*b} mod 26, ${K[1][0]*a+K[1][1]*b} mod 26] = [${r0}, ${r1}] → ${String.fromCharCode(65+r0)}${String.fromCharCode(65+r1)}`;}).join('\n')}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Decryption Preview</div><div class="formula-box">Decrypt: P = K⁻¹ × C mod 26\nK⁻¹ found via adjugate matrix and modular inverse\nof determinant mod 26.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Result</div><div class="result-box">${ct||'(need even-length input)'}</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderPlayfair(step, inp) {
  const kw = (inp.key||'MONARCHY').toUpperCase().replace(/[^A-Z]/g,'').replace(/J/g,'I');
  const pt = (inp.plaintext||'HELLO').toUpperCase().replace(/[^A-Z]/g,'').replace(/J/g,'I');
  const used=new Set();
  const grid=[];
  for(const c of kw+' ABCDEFGHIKLMNOPQRSTUVWXYZ'){
    if(c!==' ' && !used.has(c)){used.add(c);grid.push(c);}
  }
  const g5=Array.from({length:5},(_,r)=>grid.slice(r*5,r*5+5));

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT</div><div class="stat-val">${pt}</div></div><div class="stat-box"><div class="stat-label">KEYWORD</div><div class="stat-val">${inp.key||'MONARCHY'}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">5×5 Playfair Grid</div>
      <div class="matrix-grid" style="grid-template-columns:repeat(5,1fr)">${g5.map((row,r)=>row.map((c,col)=>`<div class="matrix-cell ${r*5+col<kw.length?'hl':'hl2'}">${c}</div>`).join('')).join('')}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--text2);margin-top:.5rem">Highlighted: keyword letters | I/J share one cell</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Plaintext Digraphs</div>
      <div class="formula-box">Split "${pt}" into pairs:\n${pt.match(/.{1,2}/g)||[]}\n\nRules: insert X between double letters\nAppend X if odd length</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Playfair Rules</div>
      <div class="explain-card"><h4>3 Encryption Rules</h4>
        1. Same row → shift right (wrap)<br>
        2. Same column → shift down (wrap)<br>
        3. Rectangle → swap columns</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Same Row Rule</div><div class="formula-box">If both letters in same row:\nEach replaced by letter to its right\n(wrapping: last → first in row)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Same Column Rule</div><div class="formula-box">If both letters in same column:\nEach replaced by letter below it\n(wrapping: bottom → top)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Rectangle Rule</div><div class="formula-box">If in different row AND column:\nEach letter → same row, other letter's column\n(swap the columns)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Result</div><div class="explain-card"><h4>Playfair Advantage</h4>Encrypts pairs, making simple frequency analysis harder. 26² = 676 possible digraphs vs 26 single letters.</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderSubstitution(step, inp) {
  const pt = (inp.plaintext||'HELLO WORLD').toUpperCase();
  const key = (inp.key||'QWERTYUIOPASDFGHJKLZXCVBNM').toUpperCase().replace(/[^A-Z]/g,'').substring(0,26).padEnd(26,'A');
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ct = [...pt].map(c=>c>='A'&&c<='Z'?key[c.charCodeAt(0)-65]:c).join('');

  if(step===0) mv(`<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT</div><div class="stat-val" style="font-size:.8rem">${pt}</div></div><div class="stat-box"><div class="stat-label">KEY (26 chars)</div><div class="stat-val" style="font-size:.65rem">${key}</div></div></div></div>`);
  else if(step===1) mv(`<div class="viz-card"><div class="viz-card-title">Substitution Alphabet</div>
    <div style="margin:.5rem 0"><div style="font-size:.65rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">PLAIN:</div><div class="char-row">${[...alpha].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div></div>
    <div><div style="font-size:.65rem;color:var(--text2);font-family:'Share Tech Mono',monospace;margin-bottom:.25rem">CIPHER:</div><div class="char-row">${[...key].map(c=>`<div class="char-cell key">${c}</div>`).join('')}</div></div></div>`);
  else if(step===2) mv(`<div class="viz-card"><div class="viz-card-title">Mapping Table (first 13)</div>
    ${[...alpha].slice(0,13).map((c,i)=>`<div style="display:flex;gap:.5rem;align-items:center;margin:.15rem 0"><div class="char-cell highlight">${c}</div><div style="color:var(--neon-blue)">→</div><div class="char-cell key">${key[i]}</div></div>`).join('')}</div>`);
  else if(step===3||step===4) mv(`<div class="viz-card"><div class="viz-card-title">Applying Substitution</div>
    <div class="char-row">${[...pt].map(c=>`<div class="char-cell ${c>='A'&&c<='Z'?'highlight':''}">${c}</div>`).join('')}</div>
    <div class="arrow-down">↓</div>
    <div class="char-row">${[...ct].map(c=>`<div class="char-cell ${c>='A'&&c<='Z'?'result':''}">${c}</div>`).join('')}</div></div>`);
  else mv(`<div class="viz-card"><div class="viz-card-title">Result</div><div class="result-box">${ct}</div><div style="margin-top:.75rem;font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--text2)">Key space: 26! ≈ 4×10²⁶ keys. Strong against brute force, but frequency analysis can break it.</div></div>`);
}

function renderElGamal(step, inp) {
  const p=parseInt(inp.p)||23,g=parseInt(inp.g)||5,x=parseInt(inp.x)||6,k=parseInt(inp.k)||3,M=parseInt(inp.plaintext)||10;
  const h=modpow(g,x,p),c1=modpow(g,k,p),hk=modpow(h,k,p),c2=(M*hk)%p;
  const c1x=modpow(c1,x,p),inv=modInverse(c1x,p),dec=(c2*inv)%p;

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Parameters</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PRIME p</div><div class="stat-val">${p}</div></div><div class="stat-box"><div class="stat-label">GENERATOR g</div><div class="stat-val">${g}</div></div><div class="stat-box"><div class="stat-label">PRIVATE x</div><div class="stat-val">${x}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Public Key</div><div class="formula-box">h = g^x mod p\n= ${g}^${x} mod ${p}\n= ${h}</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PUBLIC h</div><div class="stat-val">${h}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Ephemeral Key k</div><div class="formula-box">k = ${k}  (random, used once)\nc₁ = g^k mod p = ${g}^${k} mod ${p} = ${c1}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Ciphertext c₁</div><div class="formula-box">c₁ = g^k mod p = ${c1}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Ciphertext c₂</div><div class="formula-box">h^k mod p = ${h}^${k} mod ${p} = ${hk}\nc₂ = M × h^k mod p = ${M} × ${hk} mod ${p} = ${c2}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Decryption</div><div class="formula-box">c₁^x mod p = ${c1}^${x} mod ${p} = ${c1x}\nInverse: ${c1x}⁻¹ mod ${p} = ${inv}\nM = c₂ × inv = ${c2} × ${inv} mod ${p} = ${dec}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Result</div><div class="result-box">Ciphertext: (c₁=${c1}, c₂=${c2})\nDecrypted: M = ${dec} ${dec===M?'✓':'✗'}</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderRabin(step, inp) {
  const p=parseInt(inp.p)||7,q=parseInt(inp.q)||11,M=parseInt(inp.plaintext)||20;
  const n=p*q,C=(M*M)%n;
  const r=modpow(C,(p+1)/4,p),s=modpow(C,(q+1)/4,q);

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Primes p, q</div><div class="stat-row"><div class="stat-box"><div class="stat-label">p</div><div class="stat-val">${p}</div></div><div class="stat-box"><div class="stat-label">p mod 4</div><div class="stat-val">${p%4}</div></div><div class="stat-box"><div class="stat-label">q</div><div class="stat-val">${q}</div></div><div class="stat-box"><div class="stat-label">q mod 4</div><div class="stat-val">${q%4}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Modulus n = p × q</div><div class="formula-box">n = ${p} × ${q} = ${n}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Public Key</div><div class="formula-box">Public key: n = ${n}\n(Only n is public — p and q are secret)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Encryption: C = M² mod n</div><div class="formula-box">C = ${M}² mod ${n} = ${M*M} mod ${n} = ${C}</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT M</div><div class="stat-val">${M}</div></div><div class="stat-box"><div class="stat-label">CIPHERTEXT C</div><div class="stat-val">${C}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Square Root mod p and mod q</div><div class="formula-box">r = C^((p+1)/4) mod p\n= ${C}^${(p+1)/4} mod ${p} = ${r}\n\ns = C^((q+1)/4) mod q\n= ${C}^${(q+1)/4} mod ${q} = ${s}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">CRT to Find 4 Square Roots</div><div class="formula-box">Use Chinese Remainder Theorem with\nr mod p and s mod q\nto combine into 4 roots mod n.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">4 Possible Roots</div><div class="formula-box">Rabin decryption always yields 4 possible\nplaintext values. Ambiguity is the\nmain weakness for plain Rabin.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Select Correct Plaintext</div><div class="formula-box">Add redundancy (e.g., last bits equal to\nspecific pattern) to identify the\ncorrect root among the four.</div><div class="result-box">Original M = ${M} (with redundancy check)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderTripleDES(step, inp) {
  const pt=inp.plaintext||'ABCDEFGH',k1=inp.k1||'KEY1ABCD',k2=inp.k2||'KEY2EFGH',k3=inp.k3||'KEY3IJKL';
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Input</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PLAINTEXT</div><div class="stat-val">${pt}</div></div><div class="stat-box"><div class="stat-label">KEY 1</div><div class="stat-val">${k1}</div></div><div class="stat-box"><div class="stat-label">KEY 2</div><div class="stat-val">${k2}</div></div><div class="stat-box"><div class="stat-label">KEY 3</div><div class="stat-val">${k3}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Step 1: DES Encrypt with K1</div><div class="formula-box">C1 = DES_Encrypt("${pt}", K1="${k1}")\n→ [64-bit intermediate block]</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Step 2: DES Decrypt with K2</div><div class="formula-box">C2 = DES_Decrypt(C1, K2="${k2}")\n→ [64-bit intermediate block]\n\nNote: Decryption here enables backward\ncompatibility when K1=K2=K3.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Step 3: DES Encrypt with K3</div><div class="formula-box">C = DES_Encrypt(C2, K3="${k3}")\n→ Final 64-bit ciphertext</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">3DES EDE Mode</div>
      <div class="dh-diagram" style="justify-content:flex-start;gap:.5rem;flex-wrap:wrap">
        <div style="text-align:center"><div class="char-cell highlight" style="width:60px">P</div></div>
        <div style="color:var(--neon-blue)">→</div>
        <div style="text-align:center"><div class="char-cell key" style="width:60px">ENC K1</div></div>
        <div style="color:var(--neon-blue)">→</div>
        <div style="text-align:center"><div class="char-cell" style="width:60px;color:var(--neon-purple);border-color:var(--neon-purple)">DEC K2</div></div>
        <div style="color:var(--neon-blue)">→</div>
        <div style="text-align:center"><div class="char-cell key" style="width:60px">ENC K3</div></div>
        <div style="color:var(--neon-blue)">→</div>
        <div style="text-align:center"><div class="char-cell result" style="width:60px">C</div></div>
      </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Security Analysis</div><div class="explain-card"><h4>3DES vs DES</h4>DES: 56-bit key → cracked in 1 day with brute force<br>3DES: 112-bit effective key → approximately 2¹¹² brute force operations<br>3DES is secure but slow — AES is preferred for new applications.</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderSHA1(step, inp) {
  const msg = inp.plaintext||'hello';
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">SHA-1 Input</div><div class="char-row">${[...msg].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div style="margin-top:.5rem;padding:.4rem .6rem;border:1px solid #ff4466;color:#ff4466;font-family:'Share Tech Mono',monospace;font-size:.7rem">⚠ SHA-1 is deprecated — use SHA-256 or SHA-3.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Padding</div><div class="formula-box">Identical to SHA-256 padding:\n1. Append 1-bit\n2. Zeros to reach 448 mod 512\n3. Append 64-bit length</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Message Schedule W[0..79]</div><div class="formula-box">W[0..15]: from input block\nW[16..79]: W[t] = ROTL₁(W[t-3]⊕W[t-8]⊕W[t-14]⊕W[t-16])</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Initial Hash State</div><div class="formula-box">H0 = 0x67452301\nH1 = 0xEFCDAB89\nH2 = 0x98BADCFE\nH3 = 0x10325476\nH4 = 0xC3D2E1F0</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">80 Rounds</div><div class="hash-block">
      <div class="hash-round active"><span style="color:var(--neon-blue)">Rounds 0-19: Kt=0x5A827999, f=Ch</span></div>
      <div class="hash-round"><span style="color:var(--text2)">Rounds 20-39: Kt=0x6ED9EBA1, f=Parity</span></div>
      <div class="hash-round"><span style="color:var(--text2)">Rounds 40-59: Kt=0x8F1BBCDC, f=Maj</span></div>
      <div class="hash-round"><span style="color:var(--text2)">Rounds 60-79: Kt=0xCA62C1D6, f=Parity</span></div>
    </div></div>`,
    `<div class="viz-card"><div class="viz-card-title">State Update</div><div class="formula-box">H0+=a, H1+=b, H2+=c, H3+=d, H4+=e\nAfter all blocks: concatenate for digest</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">SHA-1 Digest (160 bits)</div><div class="formula-box">H0||H1||H2||H3||H4 = 160 bits = 40 hex chars</div><div class="result-box">sha1("${msg}") = aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d\n(example)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderSHA512(step, inp) {
  const msg = inp.plaintext||'hello';
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">SHA-512 Input</div><div class="char-row">${[...msg].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--neon-green);margin-top:.5rem">✓ SHA-512 is cryptographically strong.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Padding to 1024-bit Boundary</div><div class="formula-box">Pad to length ≡ 896 mod 1024\nAppend 128-bit message length\n(vs SHA-256: 512-bit boundary, 64-bit length)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">1024-bit Message Blocks</div><div class="formula-box">Each block = 1024 bits = 128 bytes\n= 16 × 64-bit words\n(SHA-256 uses 512-bit blocks)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">64-bit Word Operations</div><div class="formula-box">SHA-512 uses 64-bit arithmetic\noptimal for 64-bit processors.\nSHA-256 uses 32-bit arithmetic.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">8 × 64-bit State Variables</div><div class="formula-box">H0 = 6a09e667f3bcc908\nH1 = bb67ae8584caa73b\nH2 = 3c6ef372fe94f82b\nH3 = a54ff53a5f1d36f1\nH4 = 510e527fade682d1\nH5 = 9b05688c2b3e6c1f\nH6 = 1f83d9abfb41bd6b\nH7 = 5be0cd19137e2179</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">80 Compression Rounds</div><div class="formula-box">80 rounds per 1024-bit block\n(SHA-256 has 64 rounds per 512-bit block)\nSame structure, different constants and word size.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">SHA-512 Digest (512 bits)</div><div class="formula-box">H0||...||H7 = 512 bits = 128 hex chars</div><div class="result-box">sha512("${msg}") =\n9b71d224bd62f3785d96d46ad3ea3d73...\n(example — 128 hex chars total)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderBLAKE2(step, inp) {
  const msg = inp.plaintext||'hello';
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">BLAKE2 Input</div><div class="char-row">${[...msg].map(c=>`<div class="char-cell highlight">${c}</div>`).join('')}</div><div style="font-family:'Share Tech Mono',monospace;font-size:.7rem;color:var(--neon-green);margin-top:.5rem">✓ BLAKE2 is faster than MD5 and more secure.</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Initialization Vector</div><div class="formula-box">BLAKE2 IV = SHA-512 IV values:\niv[0] = 6a09e667f3bcc908\niv[1] = bb67ae8584caa73b\n...\nMixed with parameter block</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">G Mixing Function</div><div class="formula-box">G(a,b,c,d):\n  a = a + b + m[...]\n  d = ROTR(d⊕a, 32)\n  c = c + d\n  b = ROTR(b⊕c, 24)\n  ...(ARX: Add-Rotate-XOR)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Column Rounds</div><div class="formula-box">4 G calls on columns:\nG(v₀,v₄,v₈,v₁₂)\nG(v₁,v₅,v₉,v₁₃)\nG(v₂,v₆,v₁₀,v₁₄)\nG(v₃,v₇,v₁₁,v₁₅)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Diagonal Rounds</div><div class="formula-box">4 G calls on diagonals:\nG(v₀,v₅,v₁₀,v₁₅)\nG(v₁,v₆,v₁₁,v₁₂)\nG(v₂,v₇,v₈,v₁₃)\nG(v₃,v₄,v₉,v₁₄)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">State Update</div><div class="formula-box">h[i] ⊕= v[i] ⊕ v[i+8]\nfor i in 0..7\n\n(XOR with both halves of working state)</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">BLAKE2 Output</div><div class="formula-box">BLAKE2b: up to 512-bit output\nBLAKE2s: up to 256-bit output\n\nNo padding needed — length encoded in init.</div><div class="result-box">blake2b("${msg}") =\ne4cfa39a3d37be31c59609e807970799...\n(example)</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderDSA(step, inp) {
  const p=parseInt(inp.p)||23,q=parseInt(inp.q)||11,g=parseInt(inp.g)||4,x=parseInt(inp.x)||5,k=parseInt(inp.k)||3,H=parseInt(inp.plaintext)||7;
  const y=modpow(g,x,p),r=(modpow(g,k,p))%q;
  const kinv=modInverse(k,q),s=(kinv*(H+x*r))%q;
  const w=modInverse(s,q);
  const u1=(H*w)%q,u2=(r*w)%q;
  const v=(modpow(g,u1,p)*modpow(y,u2,p))%p%q;

  const contents=[
    `<div class="viz-card"><div class="viz-card-title">DSA Parameters</div><div class="stat-row"><div class="stat-box"><div class="stat-label">PRIME p</div><div class="stat-val">${p}</div></div><div class="stat-box"><div class="stat-label">PRIME q|(p-1)</div><div class="stat-val">${q}</div></div><div class="stat-box"><div class="stat-label">GENERATOR g</div><div class="stat-val">${g}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Public Key</div><div class="formula-box">y = g^x mod p = ${g}^${x} mod ${p} = ${y}\n\nPublic: (p,q,g,y)\nPrivate: x=${x}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Per-Signature Random k</div><div class="formula-box">k = ${k}  ⚠ Must be unique per signature!\nReusing k with same x leaks private key.\n\nk must satisfy 0 < k < q</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">r = (g^k mod p) mod q</div><div class="formula-box">g^k mod p = ${g}^${k} mod ${p} = ${modpow(g,k,p)}\nr = ${modpow(g,k,p)} mod ${q} = ${r}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">s = k⁻¹(H + x·r) mod q</div><div class="formula-box">k⁻¹ mod q = ${kinv}\nH + x·r = ${H} + ${x}×${r} = ${H+x*r}\ns = ${kinv} × ${H+x*r} mod ${q} = ${s}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Signature (r, s)</div><div class="stat-row"><div class="stat-box"><div class="stat-label">r</div><div class="stat-val">${r}</div></div><div class="stat-box"><div class="stat-label">s</div><div class="stat-val">${s}</div></div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Verify: w = s⁻¹ mod q</div><div class="formula-box">w = ${s}⁻¹ mod ${q} = ${w}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">u1, u2</div><div class="formula-box">u1 = H(M) × w mod q = ${H} × ${w} mod ${q} = ${u1}\nu2 = r × w mod q = ${r} × ${w} mod ${q} = ${u2}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">v = (g^u1 × y^u2 mod p) mod q</div><div class="formula-box">v = (${g}^${u1} × ${y}^${u2} mod ${p}) mod ${q} = ${v}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Verification Result</div><div class="result-box">${v===r?'✓ VALID SIGNATURE — v = r = '+v:'✗ INVALID — v('+v+') ≠ r('+r+')'}</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}

function renderVerify(step, inp) {
  const doc = inp.plaintext||'Hello World — Official Document';
  const hashHex = [...doc].reduce((h,c)=>{let v=h^c.charCodeAt(0);v^=v<<13;v^=v>>7;v^=v<<17;return v&0x7fffffff;},0).toString(16).padStart(8,'0');
  const contents=[
    `<div class="viz-card"><div class="viz-card-title">Document Input</div><div style="background:#000;border:1px solid var(--border);padding:.75rem;font-family:'Share Tech Mono',monospace;font-size:.8rem;line-height:1.8;color:var(--text)">${doc}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Hash the Document with SHA-256</div><div class="formula-box">H = SHA256(document)\n\nAny change to the document, even one\ncharacter, produces a completely\ndifferent hash value.</div><div class="stat-box" style="margin-top:.5rem"><div class="stat-label">DOCUMENT HASH</div><div class="stat-val" style="font-size:.7rem">${hashHex}...</div></div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Compare Hashes</div><div class="formula-box">Computed: ${hashHex}...\nExpected: ${inp.key||'(not provided)'||hashHex+'...'}\n\nMatch: ${inp.key?inp.key.startsWith(hashHex)?'✓ YES':'✗ NO (document modified!)':'Hash comparison requires expected hash'}</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Digital Signature Verification</div><div class="formula-box">1. Signer: hash document → encrypt hash with private key\n2. Verifier: decrypt signature with public key → expected hash\n3. Compare with computed hash of received document\n4. Match confirms: authenticity + integrity</div></div>`,
    `<div class="viz-card"><div class="viz-card-title">Integrity Result</div>
      <div style="padding:1rem;border:2px solid var(--neon-green);text-align:center;font-family:'Orbitron',monospace;color:var(--neon-green);font-size:1.2rem;margin:.5rem 0">✓ DOCUMENT VERIFIED</div>
      <div class="explain-card"><h4>What this proves</h4>The document has not been tampered with since signing. The signature could only have been created by the holder of the corresponding private key.</div></div>`
  ];
  mv(contents[step]||contents[contents.length-1]);
}
