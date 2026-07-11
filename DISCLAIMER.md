# ⚠️ Legal Disclaimer & Terms of Use

> **TL;DR:** This is a personal hobby project for terminal enthusiasts. Use it only for personal, non-commercial listening with an active YouTube Music subscription. It violates YouTube's Terms of Service — you use it at your own risk.

---

## 1. Not Affiliated with Google or YouTube

This project — **youtube-music-cli** — is an independent, open-source hobby project maintained by [Miłosz Zając](https://github.com/netflyapp).

It is **not** affiliated with, endorsed by, sponsored by, or in any way officially connected to **Google LLC**, **YouTube LLC**, or **YouTube Music**. All product names, logos, and brands are the property of their respective owners.

---

## 2. YouTube Terms of Service

Using this application likely **violates YouTube's Terms of Service**, specifically:

- **Section 5.B** — prohibition on accessing YouTube through means other than the official interface
- **Section 5.E** — prohibition on downloading content without prior written permission from YouTube
- **Section 5.H** — prohibition on circumventing technical protection measures

This application accesses YouTube Music using the internal `Innertube` API (reverse-engineered, not publicly documented) and uses `yt-dlp` to extract audio streams. Neither of these is authorized by Google.

**Consequence of ToS violation:** Google/YouTube may terminate your account or restrict access. This is a **civil matter** — it is not a criminal offense.

---

## 3. Personal Use Only

This software is intended **exclusively for personal, non-commercial use** by individuals who:

- ✅ Have an **active YouTube Music Premium** (or YouTube Premium) subscription
- ✅ Use it for private listening — not for redistribution, broadcasting, or public performance
- ✅ Do not use it to generate revenue or commercial gain

**Do NOT use this software to:**
- ❌ Redistribute or publicly share downloaded/cached audio files
- ❌ Use downloaded content for commercial purposes
- ❌ Build a competing commercial service based on this tool
- ❌ Circumvent YouTube Music's geo-restrictions or paywalls

---

## 4. Offline Cache & Downloads

The **Offline Mode** and **Download** features save audio content to local storage. This is the most legally sensitive aspect of the application.

- In most jurisdictions, private copying for personal use is permitted under a "private copy exception" (e.g. Polish law: Art. 23 of the Copyright Act; EU Copyright Directive)
- However, this exception typically does **not** apply if the source material is accessed in violation of technical protection measures
- The legality varies significantly by country — **check your local copyright law**

**Best practice:**
- Only cache/download tracks you are actively streaming with an active subscription
- Do not keep cached files indefinitely — treat them as temporary playback buffers
- Do not share cached files with others

The `offlineAutoCache` option is **disabled by default** for this reason.

---

## 5. Dependency Notice

This software depends on third-party tools:

| Tool | License | Legal status |
|---|---|---|
| `yt-dlp` | Unlicense | Legally contested; EFF-defended; active on GitHub with 90k+ stars |
| `mpv` | GPL v2+ | Open-source, widely distributed |
| `youtubei.js` | MIT | Reverse-engineers YouTube's internal Innertube API |

Using `yt-dlp` may itself violate YouTube's ToS and potentially local laws depending on jurisdiction. The author of this project is not responsible for how these dependencies are used.

---

## 6. Hobby Project — No Warranty

This software is provided **"as is"**, without warranty of any kind, express or implied. The author:

- Makes no guarantees that the software is free of bugs or legal risk
- Is not responsible for any account bans, legal claims, or other consequences of using this software
- Does not provide legal advice — consult a qualified lawyer if you have specific legal concerns

The full software license is in [`LICENSE`](LICENSE).

---

## 7. Comparison with Similar Projects

This project operates in the same legal space as many widely-used open-source tools:

| Project | Stars | Status |
|---|---|---|
| `yt-dlp` | 90k+ ⭐ | Active, defended by EFF against RIAA DMCA (2020) |
| `youtube-dl` | 130k+ ⭐ | Active after GitHub restored it post-DMCA |
| `spotify-tui` | 16k+ ⭐ | Legal (uses official Spotify API) |
| `involvex/youtube-music-cli` | Original fork base | Active, published on npm |

YouTube has historically pursued action against **commercial** piracy services, not personal open-source hobby projects. That said, this is not legal advice and the situation can change.

---

## 8. Reporting Legal Concerns

If you believe this project infringes on your rights or you have a legal concern, please contact the maintainer via [GitHub](https://github.com/netflyapp) before taking any other action.

---

*This disclaimer was last updated: 2026-07-12*
*This is not legal advice. If you need legal counsel, consult a licensed attorney in your jurisdiction.*
