# Sequim Games

A retro, California Games-style browser game made as a birthday gift for Sebastian and Misha.
Four events, one shared scoreboard, built for Android phones held sideways (desktop works too).

| Event | Star | What you do |
|---|---|---|
| Volt Run | Sebastian | Ride an electric skateboard through downtown, the bike path and the trails |
| Patch Panic | Sebastian | Patch a modular synth and play the rhythm before the groove falls apart |
| Opening Night | Misha | Hit your marks, poses and lines in an avant-garde three-act play |
| Roll for Initiative | Misha | Real-time D&D battle ending with Sebastian the Terrible, Lord of the Volts |

## Build

```sh
./build.sh          # writes dist/index.html, one self-contained page
open dist/index.html
```

There is no framework and no bundler: `build.sh` concatenates the files in `src/` into a single page.

## Layout

- `src/page-head.html`: title, fonts, CSS, canvas, rotate-your-phone overlay
- `src/art.js`: palette, pixel sprite helpers, portraits and sprites
- `src/engine.js`: 320x180 screen scaling, bitmap text, drawing helpers, input, Web Audio synth, scores
- `src/shell.js`: event registry, title, menu, pause, results, name entry, high scores, `boot()`
- `src/events/*.js`: one file per event
- `design/`: the mockup board used while planning (`design/build.sh`)
- `tools/`: Playwright bots and screenshot scripts used for testing and balance

## Adding an event

1. Create `src/events/<id>.js` and call `registerEvent({ id, name, star, sub, icon, create })`.
2. `create(api)` returns `{ update(dt), draw(ctx), pause?, destroy? }` and calls
   `api.finish({ score, headline, stats })` when the run ends.
3. Add the file to `build.sh` and the id to `PLANNED` in `src/shell.js` to set its menu position.

## Handy URLs

- `#play-<id>` starts an event directly, for example `#play-volt`
- `#misha` or `#sebastian` (or `/misha`, `/sebastian`) puts that brother's events first

## Testing

The bots in `tools/` drive a built page through debug hooks (`window.__voltDebug`, `__patchDebug`,
`__stageDebug`, `__dndDebug`):

```sh
node tools/shot.js "$PWD/dist/index.html" out.png
node tools/bot.js "$PWD/dist/index.html"
node tools/dnd2test.js "$PWD/dist/index.html" /tmp/shots fighter 0.04
```

## Deploying

Every push to `main` builds the page and ships it to the server (`.github/workflows/deploy.yml`).
The server keeps the last 5 releases in `/srv/sequim-games/releases/`, and nginx serves whichever one
the `current` symlink points at.

One-time setup:

1. On your laptop, make a key used only for deploys:
   `ssh-keygen -t ed25519 -N "" -C sequim-deploy -f ~/.ssh/sequim_deploy`
2. Add a DNS A record for the game's hostname pointing at the server.
3. On the server, as root: `bash deploy/setup-server.sh <hostname> "<contents of ~/.ssh/sequim_deploy.pub>"`
4. Add the three repo secrets the script prints (`DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_SSH_KEY`).

Rollback, on the server: `ls -t /srv/sequim-games/releases`, then
`sudo -u deploy ln -sfn releases/<name> /srv/sequim-games/current`.
Or re-run an earlier Deploy workflow from the Actions tab.

## Scores

Scores are kept in `localStorage` for now. A small shared score API is planned for deployment.
