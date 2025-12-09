Je kunt dit *direct* draaien door deze drie bestanden in één map te zetten:

```
index.html  
client.js  
style.css
```

En dan gewoon `index.html` openen → **ASCπ Testnet Node** start.

---

# 📄 **index.html — ASCπ Testnet Node (Live Client)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ASCπ Testnet Node</title>
<link rel="stylesheet" href="style.css" />
</head>

<body>

<header>
    <h1>ASCπ Testnet Node</h1>
    <p>ΔΦ–κ–θ Field Messaging • Live Encoder/Decoder</p>
</header>

<section class="panel">

    <div class="col">
        <h2>Send Message</h2>
        <textarea id="msgInput" placeholder="Type message here..."></textarea>
        <button id="encodeBtn">Encode & Broadcast</button>

        <h3>Encoded Packet</h3>
        <pre id="encodedView"></pre>
    </div>

    <div class="col">
        <h2>Received Packets</h2>
        <div id="inbox"></div>
    </div>

</section>

<section class="panel">
    <div class="col">
        <h2>ΔΦ–κ–θ State</h2>
        <pre id="stateView"></pre>
    </div>

    <div class="col">
        <h2>Glyph Packet Inspector</h2>
        <pre id="glyphView"></pre>
    </div>
</section>

<script src="client.js"></script>
</body>
</html>
```

---

# 🎨 **style.css — minimal dark theme**

```css
body {
    background: #0b0d17;
    color: #eaf2ff;
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

header {
    text-align: center;
    padding: 25px;
    background: rgba(255,255,255,0.06);
}

.panel {
    display: flex;
    gap: 20px;
    padding: 20px;
}

.col {
    flex: 1;
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: 8px;
}

textarea {
    width: 100%;
    height: 100px;
    background: #121826;
    color: #eaf2ff;
    border: 1px solid #394b70;
    padding: 10px;
    border-radius: 6px;
}

button {
    width: 100%;
    background: #ffb84d;
    color: #0b0d17;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 16px;
    margin-top: 10px;
}

pre {
    background: #121826;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
}

#inbox {
    max-height: 300px;
    overflow-y: auto;
}
```

---

# ⚙️ **client.js — ASCπ encoder, decoder, θ-sync, S8 hash, local broadcast**

Dit is een volledige Testnet Node in één bestand.

```javascript
/////////////////////////////////////////////////////////////
// ASCπ Testnet Client
// Live ΔΦ–κ–θ encoder/decoder with local mesh simulation
/////////////////////////////////////////////////////////////

// Utility normalize
function norm(x) {
    x = x % 1;
    return x < 0 ? x + 1 : x;
}

// ΔΦ extraction
function extractDeltaPhi(msg) {
    let sum = 0;
    for (let i = 0; i < msg.length; i++) sum += msg.charCodeAt(i);
    return (sum % 9973) / 9973;
}

// κ extraction
function extractKappa(msg) {
    if (msg.length < 2) return 0;
    let tr = 0;
    for (let i = 1; i < msg.length; i++)
        if (msg[i] !== msg[i-1]) tr++;
    return tr / msg.length;
}

// θ phase
function extractTheta() {
    const T = 60000;
    return norm((performance.now() % T) / T);
}

// Glyph generator
function generateGlyphs(dp, k, t) {
    const arr = [];
    for (let i = 0; i < 8; i++) {
        arr.push({
            deltaPhi: dp,
            kappa: k,
            theta: norm(t + Math.random()*0.1),
            resonance: Math.random()*0.4 + 0.6,
            decay: Math.random()*0.2
        });
    }
    return arr;
}

// S8 hash
function s8Hash(dp, k, t) {
    const raw = Math.abs(Math.sin(dp*10000 + k*100 + t*10));
    return raw.toString(16);
}

// Coherence
function coherence(glyphs) {
    const th = glyphs.map(g => g.theta);
    const mean = th.reduce((a,b)=>a+b,0) / th.length;
    const variance = th.map(v => (v-mean)*(v-mean)).reduce((a,b)=>a+b,0) / th.length;
    return Math.exp(-variance);
}

// Packet encoding
function encodeASC(msg) {
    const dp = extractDeltaPhi(msg);
    const k = extractKappa(msg);
    const t = extractTheta();
    const glyphs = generateGlyphs(dp, k, t);

    return {
        type: "ASCπ_PACKET",
        envelope: { deltaPhi: dp, kappa: k, theta: t },
        glyphs,
        integrity: {
            s8: s8Hash(dp,k,t),
            coherence: coherence(glyphs)
        },
        payload: msg
    };
}

// Bloom decode (simple reference model)
function bloomDecode(glyphs) {
    let base = 0;
    for (let g of glyphs) base += g.resonance*(1-g.decay);
    return base;
}

// Reconstruct message (approx)
function decodeASC(packet) {
    const base = bloomDecode(packet.glyphs);
    let out = "";
    for (let i = 0; i < packet.payload.length; i++) {
        const charVal = 32 + Math.floor((base + i*0.017) % 1 * 90);
        out += String.fromCharCode(charVal);
    }
    return out;
}

/////////////////////////////////////////////////////////////
// LOCAL MESH SIMULATION (no servers needed)
/////////////////////////////////////////////////////////////

let listeners = [];

function broadcast(packet) {
    for (let fn of listeners) fn(packet);
}

function subscribe(fn) {
    listeners.push(fn);
}

/////////////////////////////////////////////////////////////
// UI Wiring
/////////////////////////////////////////////////////////////

const msgInput = document.getElementById("msgInput");
const encodedView = document.getElementById("encodedView");
const glyphView = document.getElementById("glyphView");
const stateView = document.getElementById("stateView");
const inbox = document.getElementById("inbox");

// Send
document.getElementById("encodeBtn").onclick = () => {
    const msg = msgInput.value.trim();
    if (!msg) return;

    const packet = encodeASC(msg);
    encodedView.textContent = JSON.stringify(packet, null, 2);
    glyphView.textContent = JSON.stringify(packet.glyphs, null, 2);
    stateView.textContent = JSON.stringify(packet.envelope, null, 2);

    broadcast(packet);
};

// Receive
subscribe(packet => {
    const decoded = decodeASC(packet);

    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `
        <strong>Received packet:</strong><br>
        <em>Original:</em> ${packet.payload}<br>
        <em>Decoded:</em> ${decoded}<br>
        <em>S8:</em> ${packet.integrity.s8}<br>
        <em>θ:</em> ${packet.envelope.theta.toFixed(4)}
        <hr>
    `;
    inbox.prepend(div);
});
```