# Sequim Games

A retro, California Games-style browser game made as a birthday gift for Sebastian and Misha.
Five events plus a bonus round, one shared scoreboard, built for Android phones held sideways (desktop works too).

| Event | Star | What you do |
|---|---|---|
| Volt Run | Sebastian | Ride an electric skateboard through downtown, the bike path and the trails |
| Patch Panic | Sebastian | Patch a modular synth and play the rhythm before the groove falls apart |
| Opening Night | Misha | Hit your marks, poses and lines in an avant-garde three-act play |
| Roll for Initiative | Misha | Real-time D&D battle ending with Sebastian the Terrible, Lord of the Volts |
| Golden Hour | Misha | Drive the ambulance up 101 to Port Angeles before the patient (Sebastian) gives up |
| Rainbow Rush (bonus) | Sophia | Run, jump and double jump over candy clouds, lavender hills and the starlight sky, grabbing sparkles and riding rainbows |

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
- `static/`: copied into `dist/` as is (web app manifest, home-screen icons)
- `tools/`: Playwright bots and screenshot scripts used for testing and balance

## Adding an event

Add one file, `src/events/<id>.js`, that calls

```js
registerEvent({ id, name, star: 'misha' | 'sebastian', sub, icon, create });
```

- `icon` is a function `(c, x, y)` that draws a 24x24 menu icon (or a name from `ICONS` in `shell.js`).
- `create(api)` returns `{ update(dt), draw(ctx), pause?(on), destroy?() }` and calls
  `api.finish({ score, headline, stats })` when the run ends. The shell handles the pause button,
  results, name entry, high scores and the shared scoreboard.

That's all: `build.sh` picks up every file in `src/events/`, the menu makes room (compact rows past
four events, scrolling past five), and the scoreboard accepts any event id. Events in `PLANNED` in
`shell.js` keep their menu position; new ones follow.

## Phones

On Android the first tap switches to fullscreen and locks landscape; the menu has a FULL SCREEN
button to toggle it (F on a keyboard). Chrome's "Add to Home screen" installs it with its own icon,
always fullscreen (`static/manifest.webmanifest`). Icons are drawn from the title art by
`node tools/make-icons.js` after a build.

## Handy URLs

- `#play-<id>` starts an event directly, for example `#play-volt`
- `#misha`, `#sebastian` or `#sophia` (or `/misha` and so on) puts that person's events first

## Testing

The bots in `tools/` drive a built page through debug hooks (`window.__voltDebug`, `__patchDebug`,
`__stageDebug`, `__dndDebug`, `__ambDebug`, `__rainbowDebug`):

```sh
node tools/shot.js "$PWD/dist/index.html" out.png
node tools/bot.js "$PWD/dist/index.html"
node tools/dnd2test.js "$PWD/dist/index.html" /tmp/shots fighter 0.04
node tools/ambbot.js "$PWD/dist/index.html" 0.06 0.98   # Golden Hour: timing noise, skill
node tools/rainbowbot.js "$PWD/dist/index.html" 0.06    # Rainbow Rush: jump timing noise in seconds
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

## Scoreboard

`server/server.js` is the shared scoreboard: plain Node with its built-in SQLite, no dependencies.
The game keeps each score on the device until the server confirms it, so playing offline (or from
a `file://` build) still works, and the scores upload the next time the page can reach `/api`.
Any event id is accepted, so a new event needs no server change.

On the server it runs as the `sequim-api` container (config in `/etc/sequim-games/compose.yml`),
with the database at `/srv/sequim-games/api/data/scores.db`. A deploy that changes `server/`
restarts it. Housekeeping, as root on the server:

```sh
docker exec sequim-api node admin.js list volt      # or just: list
docker exec sequim-api node admin.js delete <id>
docker exec sequim-api node admin.js clear all      # e.g. wipe test scores before the big reveal
docker logs sequim-api
```

To run everything locally:

```sh
DB_PATH=/tmp/scores.db node server/server.js   # terminal 1
./build.sh && node tools/dev-server.js         # terminal 2, then open http://localhost:8080
```
