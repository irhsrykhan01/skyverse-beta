# skyverse-beta
WhatsApp bot SkyVerse (Beta) built with Node.js and Baileys.

# SkyVerse — Stage 1

A production-ready WhatsApp Multi-Device bot framework built on `@whiskeysockets/baileys`. Backend only — no web server, no frontend, no browser UI.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm start
```

On first run, no session will exist yet. The bot will either:

- Print a QR code in the terminal to scan with WhatsApp (default), or
- Prompt for a phone number and print a pairing code, if `USE_PAIRING_CODE=true`.

Copy `.env.example` to `.env` to customize configuration. Every variable has a safe default, so the bot runs out of the box without a `.env` file.

## Configuration

| Variable | Description | Default |
|---|---|---|
| `BOT_NAME` | Display name used in messages and the WhatsApp browser identity | `SkyVerse` |
| `PREFIX` | Command prefix | `.` |
| `OWNER_NUMBERS` | Comma-separated phone numbers (no `+`) with owner permission | *(empty)* |
| `USE_PAIRING_CODE` | Use a pairing code instead of QR login | `false` |
| `PAIRING_NUMBER` | Phone number for pairing code login; prompted if empty | *(empty)* |
| `SESSION_DIR` | Where WhatsApp auth credentials are stored | `./session` |
| `DATABASE_PATH` | Path to the local JSON database file | `./data/database.json` |
| `TIMEZONE` | IANA timezone for timestamps | `UTC` |
| `RECONNECT_DELAY_MS` | Delay before reconnecting after a dropped connection | `5000` |
| `BAILEYS_LOG_LEVEL` | Log level for the internal Baileys logger | `silent` |
| `DEBUG` | Enable verbose bot debug logs | `false` |
| `DEFAULT_COOLDOWN_SECONDS` | Fallback cooldown for commands without their own | `3` |

## Project structure

```
skyverse/
├── index.js                       # Bootstrap: database → commands → connection → shutdown hooks
├── src/
│   ├── config/config.js           # Environment-driven configuration
│   ├── utils/
│   │   ├── logger.js              # pino (for Baileys) + chalk (for CLI output)
│   │   ├── helpers.js             # Duration/byte/timestamp formatting
│   │   ├── permissions.js         # all / admin / owner permission checks
│   │   └── cooldown.js            # Per-user, per-command cooldown tracking
│   ├── database/db.js             # LowDB JSON store: users, groups, settings, warnings, stats, bot state
│   ├── core/client.js             # Baileys socket, QR/pairing login, reconnect, event wiring
│   ├── handlers/
│   │   ├── messageHandler.js      # Parses incoming messages, updates the database, dispatches commands
│   │   └── commandHandler.js      # Resolves, authorizes, rate-limits, and runs commands
│   └── plugins/
│       ├── loader.js              # Dynamically loads command modules
│       └── commands/              # ping, menu, help, runtime, info
├── data/                          # Auto-created JSON database (gitignored)
└── session/                       # Auto-created WhatsApp credentials (gitignored)
```

## Commands

- `ping` — check responsiveness and latency
- `menu` — list all available commands
- `help [command]` — usage details for a specific command
- `runtime` — how long the bot has been running
- `info` — bot, host, and database statistics

## Notes

- `axios`, `mime-types`, and `file-type` are installed as part of the core tech stack but are not yet used by any Stage 1 command — they're reserved for later stages (media handling, downloaders).
- Logging out from WhatsApp (or removing the linked device) requires deleting the `session/` folder before logging in again.
