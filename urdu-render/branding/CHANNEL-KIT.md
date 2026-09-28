# The Sealed Histories — Channel Kit (English brand · Urdu/Hindi storytelling)

**Created:** 2026-09-28 · **Status:** channel LIVE — youtube.com/@TheSealedHistories · **Assets:** this folder (regenerate: `node urdu-render/branding/render-branding.mjs`)

## Brand architecture (the Vault-of-History model)
- **Brand, banner, description: ENGLISH** — readable by everyone, premium, exportable.
- **Storytelling (voiceover): Urdu / Hindi** (Bangla planned) — the audience magnet.
- **Episode titles: in the episode's language** (Hindi/Urdu/Bangla), led by an English SEO keyword — exactly how Vault of History titles ("The History of Tea - 5000 साल की कहानी").

## 1. Identity
- **Name (Basic info → Title):** `The Sealed Histories` (created 2026-09-28 — YouTube blocked plain "Sealed Histories" because its auto-derived handle was squatted; created under this name)
- **Handle:** `@TheSealedHistories` (canonical — YouTube also resolves @SealedHistories to this channel)
- Meaning: every episode opens one sealed story. The red wax seal IS the logo.
- Squatted 2026-09-28 by "hellow", do not retry: @SealedHistories, @SealedHistory. Checked & taken: @HistoryUnsealed, @UnsealedHistory, @TheHistoryVault, @DastanETareekh, @TareekhKiDastan, @DareechaEMazi.
- **Country:** Pakistan (audience: Pakistan, India, Bangladesh + diaspora)
- **Category:** Education · **Channel language:** leave default; set per-video language on upload.

## 2. Description (copy-paste)
```
Welcome to The Sealed Histories — history you'll never forget, told in Urdu & Hindi.

Every episode opens one sealed story from the past: the salt that was once worth more than gold, the tea that started a war, the watch that conquered time, the company that bought a country. Real history, cinematic visuals, and storytelling that holds you to the last minute.

نئی قسط ہر ہفتے — تاریخ کی وہ کہانیاں جو آپ کبھی نہیں بھولیں گے۔
नई कहानी हर हफ्ते — वो इतिहास जो आप कभी नहीं भूलेंगे।

New episodes every week. Subscribe and open the vault.

📧 Business: muzzamilhassandev@gmail.com
```

## 3. Channel keywords (<500 chars)
```
the sealed histories, sealed histories, history documentary urdu, history in urdu, hindi documentary, history in hindi, تاریخ کی کہانیاں, इतिहास की कहानी, salt history, tea history documentary, east india company, history of gold, urdu kahani, hindi kahani, tareekh, itihas, forgotten history, dark history, everyday things history, history stories, asian history channel
```

## 4. Branding assets (this folder)
| File | Size | YouTube Studio → Customization → Branding |
|---|---|---|
| `avatar-800.png` | 800×800 — red wax seal "H" + brass rings (circle-crop safe) | **Picture** |
| `banner-2560x1440.png` | 2560×1440 — English name + tagline + اردو·हिंदी·বাংলা row (in safe area) | **Banner image** |
| `watermark-150.png` | 150×150 transparent wax seal | **Video watermark** |

Palette: dark walnut #2A1A0B · aged cream #F2E3C2 · brass #D6B87E · wax red #8E2321. Anton for the name, Inter for copy, Nastaliq/Devanagari/Bengali for the language row.

## 5. Title law (per episode)
`<English SEO keyword> — <hook in the episode's language> #history`
- Urdu episode: `History of Salt — وہ سفید دانہ جو سونے سے بھی قیمتی تھا | #history`
- Hindi episode: `History of Salt — वो सफ़ेद दाना जो सोने से भी कीमती था | #history`
- Bangla episode: `History of Salt — সেই সাদা দানা যা সোনার চেয়েও দামি ছিল | #history`
Rotate the language per episode (or double the channel later: one per language). Thumbnail hook language MUST match the title language (`--hook`), badge via `--badge` (Urdu «اردو دستاویزی سلسلہ» · Hindi «हिंदी डॉक्यूमेंट्री»).

## 6. First 10 episodes
| # | Topic | Object/hook | Voice | Thumb bg |
|---|---|---|---|---|
| 1 | Tea — espionage, war, empire | Robert Fortune's theft | Urdu (demo exists) | tea.jpg |
| 2 | Salt — worth more than gold | salt taxes & marches | Hindi | salt.jpg |
| 3 | Time — how man conquered time | antique watch | Urdu | watch.jpg |
| 4 | The company that bought India | East Indiaman shipwreck | Hindi | ship.jpg |
| 5 | Spices — wars fought for flavor | spice route | Urdu/Bangla | fetch |
| 6 | Gold — why it drives us mad | gold rush | Hindi | fetch |
| 7 | Paper — one sheet changed the world | first paper mill | Urdu | fetch |
| 8 | Coffee — the drink that woke the world | coffee houses | Hindi/Bangla | fetch |
| 9 | The pen — a nib that wrote history | fountain pen | Urdu | fetch |
| 10 | Coal — the black stone that burned the world | steam engine | Hindi | fetch |

## 7. Schedule & ops
- **Cadence:** 2/week — Mon + Thu **06:00 PKT** (= 06:30 IST, 07:00 BST — one slot serves all three morning audiences).
- **Trailer:** cut the first 60–90 s of episode 1 + end card "New sealed story every week".
- **Shorts:** 3 per episode (hook, best mapping, weld).
- **Monetization:** 1K subs + 4K watch-hours via long-form; Shorts for discovery.

## 8. Setup checklist
1. ✅ DONE 2026-09-28 — channel created: The Sealed Histories (@TheSealedHistories), Brand Account on muzzamilhassandev@gmail.com.
2. Upload avatar → banner → watermark.
3. Paste description + keywords; country Pakistan; category Education.
4. Phone-verify at youtube.com/verify (custom thumbnails).
5. Upload ep 1 (Tea) private + factory thumbnail; schedule 06:00 PKT Mon.
6. Trailer + playlists after ep 1.

## 9. Regeneration
- Branding: `node urdu-render/branding/render-branding.mjs`
- Thumbnails: `node tools/thumbnail-factory.mjs --niche urdu --eng "HISTORY OF" --word "SALT" --hook "وہ سفید دانہ..." --badge "اردو دستاویزی سلسلہ" --bg salt.jpg --out ...`
- Videos: local-first pipeline (ur-PK-AsadNeural for Urdu; hi-IN voices for Hindi).
