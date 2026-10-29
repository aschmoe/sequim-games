# Deploying to the elliotsoft.com server

How the DigitalOcean server is set up, and the recipe for putting a new project on it. Sequim Games
(`games.elliotsoft.com`) is the working example; copy from this repo when starting something new.

## The server at a glance

| Thing | Value |
|---|---|
| Droplet | `docker-s-1vcpu-1gb-sfo2-01` (1 vCPU, **1 GB RAM**, SFO2) |
| IP | `138.197.236.165` |
| DNS | DigitalOcean: Networking > Domains > `elliotsoft.com` (nameservers are already DigitalOcean's) |
| Web server | **nginx on the host** owns ports 80 and 443, one site per hostname |
| HTTPS | Certbot (`certbot --nginx`), renews itself |
| Docker | Installed, with `docker compose` |

What's already running, so a new project doesn't collide with it:

| Port | What | Notes |
|---|---|---|
| 22 | SSH | |
| 80 / 443 | host nginx | Serves every site by hostname |
| 447 | Erin (`elliot_app-erin-1`, `mosswill/erin`, Caddy inside) | The original app. Leave it alone. |
| 127.0.0.1:3100 | `sequim-api` (Sequim Games scoreboard) | Only reachable through nginx |

**Next free internal port: 3101.** Bind new containers to `127.0.0.1` only and let nginx proxy to them.

## How a deploy works

```
push to main
  -> GitHub Action builds the project
  -> rsync the build to /srv/<project>/releases/<timestamp-sha>/   (as the `deploy` user, over SSH)
  -> swap the /srv/<project>/current symlink to it                 (atomic, no half-uploaded site)
  -> keep the 5 newest releases, delete older ones
  -> if there's a backend and its code changed: touch /srv/<project>/api/restart
       -> a systemd .path unit notices and restarts the container (as root)
```

The design choices behind it:

- **Static files are served by nginx straight from disk.** No container for the frontend, so it
  costs no memory.
- **The `deploy` user can only write files.** Its key is marked `restrict` in `authorized_keys`, and
  it is not in the `docker` group. It can't change how a container runs, only the code a container
  mounts read-only.
- **Restarts go through a file.** The deploy writes `api/restart`; root's systemd watches it and
  runs `docker compose up -d` + `docker restart`. That's how the deploy user triggers a restart
  without any Docker rights.
- **Backend containers are locked down:** runs as the deploy user's uid, read-only filesystem,
  all capabilities dropped, memory capped (128 MB for Sequim), logs capped.
- **`Cache-Control: no-cache`** on the site, so a deploy shows up on the next page load.

### Where Sequim Games lives (the pattern to copy)

| Path | What |
|---|---|
| `/srv/sequim-games/releases/` | One folder per deploy |
| `/srv/sequim-games/current` | Symlink to the live release (nginx's `root`) |
| `/srv/sequim-games/api/app/` | Backend code, written by deploys, mounted read-only |
| `/srv/sequim-games/api/data/` | SQLite database, written by the container |
| `/srv/sequim-games/api/restart` | Touched by a deploy to restart the backend |
| `/etc/nginx/sites-available/sequim-games` | The nginx site (Certbot added the 443 block) |
| `/etc/nginx/snippets/sequim-api.conf` | The `/api/` proxy block, included by the site |
| `/etc/sequim-games/compose.yml` | Container config (root-owned on purpose) |
| `/etc/systemd/system/sequim-api-restart.{path,service}` | The restart watcher |

In the repo:

- `deploy/setup-server.sh`: one-time server setup, run as root. Safe to re-run.
- `.github/workflows/deploy.yml`: the build-and-ship workflow.

## Recipe: a new project

Pick these first:

| Name | Example |
|---|---|
| Project slug | `newthing` |
| Hostname | `newthing.elliotsoft.com` |
| Internal port (only if it has a backend) | `3101` |
| Deploy key file | `~/.ssh/newthing_deploy` |

### 1. Repo

Create the GitHub repo under `aschmoe`. If Claude should push to it, give the Claude GitHub App
access to that repo: https://github.com/apps/claude/installations/select_target (pick `aschmoe`).
Without that, Claude can clone a public repo but can't push.

### 2. Copy the deploy files

From this repo, copy `deploy/setup-server.sh` and `.github/workflows/deploy.yml`, then rename:

- `sequim-games` -> `newthing` (paths, nginx site name, `/etc/...` folder, compose project)
- `sequim-api` -> `newthing-api` (container, snippet, systemd units)
- `3100` -> `3101`
- `-p sequim` -> `-p newthing` in the compose commands
- The `Build` step and the `dist/` folder, to whatever the new project builds
- Static site only? Delete the scoreboard sections from both files (the `api` folders, snippet,
  compose file, systemd units, and the workflow's last step).

The nginx block falls back to `index.html` for unknown paths (good for single-page apps). Change
`try_files` if the project needs real 404s.

### 3. DNS

DigitalOcean > Networking > Domains > `elliotsoft.com` > **Create a record**:

- Type **A**, Hostname **newthing** (just the word), directs to **138.197.236.165**, TTL 3600.

Check from the server: `getent hosts newthing.elliotsoft.com` should print the IP. Usually a few
minutes. Ignore the yellow "Email before nameservers" banner; it doesn't apply.

### 4. Deploy key (on your laptop)

```sh
ssh-keygen -t ed25519 -N "" -C newthing-deploy -f ~/.ssh/newthing_deploy
cat ~/.ssh/newthing_deploy.pub
```

Use a new key per project, so one can be revoked without breaking the others. (All projects still
log in as the same `deploy` user, so any project's key can write to any project's folder. Fine for
personal projects; make a separate user per project if that ever matters.)

### 5. Run the setup script on the server (as root)

```sh
cd ~
curl -fsSLO https://raw.githubusercontent.com/aschmoe/newthing/main/deploy/setup-server.sh
bash setup-server.sh newthing.elliotsoft.com "ssh-ed25519 AAAA... newthing-deploy"
```

- Download it outside `/srv`; the script creates the project folder itself.
- The `curl` only works if the repo is **public**. For a private repo, open the file on GitHub,
  copy it, `nano ~/setup-server.sh`, paste, then run the same `bash` line.
- Re-running later doesn't need the key: `bash setup-server.sh newthing.elliotsoft.com`.

It ends by printing three values for the next step.

### 6. GitHub secrets

Repo > Settings > Secrets and variables > Actions > **New repository secret**:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `newthing.elliotsoft.com` |
| `DEPLOY_KNOWN_HOSTS` | The whole line the script printed (`newthing.elliotsoft.com ssh-ed25519 AAAA...`). Not secret; it lets GitHub verify the server. |
| `DEPLOY_SSH_KEY` | `cat ~/.ssh/newthing_deploy`, including the `-----BEGIN` / `-----END` lines |

Until `DEPLOY_HOST` exists, the workflow only builds and skips the upload.

### 7. First deploy

Repo > Actions > **Deploy** > **Run workflow** (enable workflows first if the tab says they're
off). After that, every push to `main` deploys on its own in about 10 seconds.

Check it: open `https://newthing.elliotsoft.com`, and for a backend,
`curl -s https://newthing.elliotsoft.com/api/health` on the server.

## Day to day

- **Deploy:** push to `main`. Work on a branch if something shouldn't go live yet (e.g. a surprise).
- **Re-deploy an old version:** Actions > pick an earlier Deploy run > Re-run.
- **Roll back by hand** (on the server):
  ```sh
  ls -t /srv/newthing/releases
  sudo -u deploy ln -sfn releases/<name> /srv/newthing/current
  ```
- **Backend logs:** `docker logs newthing-api`
- **Run something inside the backend:** `docker exec newthing-api node admin.js ...`
- **Is it running:** `docker ps --filter name=newthing-api`

## Things that bit us the first time

- **"Another instance of Certbot is already running."** Usually the renewal job; wait a minute and
  re-run. If `ps aux | grep [c]ertbot` shows nothing, a stale lock is left over:
  `rm -f /var/lib/letsencrypt/.certbot.lock /etc/letsencrypt/.certbot.lock`, then re-run.
- **Certbot asks "reinstall or renew?"** on a re-run: answer **1** (reinstall). Don't press `c`; that
  stops the script before the later steps. (The current script skips Certbot when a certificate
  already exists, so this should only happen with old copies of the script.)
- **Memory is tight.** 1 GB total, shared with Erin, nginx and Docker. Cap every container
  (`mem_limit`), and prefer static files plus a tiny backend over anything heavy.
- **No npm installs on the server.** The Sequim backend uses only Node built-ins (including
  `node:sqlite`), so the plain `node:24-alpine` image runs the code as-is. A backend that needs
  packages should either be built into its own image (in GitHub Actions, pushed to GHCR, pulled on
  the server) or have its dependencies installed during the build and shipped with the code.

## Working with Claude on this

- Claude's cloud sandbox **can't reach elliotsoft.com** (its network proxy blocks the host), and it
  **can't SSH to the server**. It checks deploys by reading the GitHub Actions run logs instead.
  Server-side commands (setup script, `docker`, rollback) are yours to run.
- Point Claude at this file at the start of a new project. "Set up deploys the way
  `aschmoe/sequim-games` does, per `deploy/SERVER.md`" is enough for it to copy and adapt both files.
