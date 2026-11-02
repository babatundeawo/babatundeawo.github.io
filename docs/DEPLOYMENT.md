# Deployment guide

This guide is for the site owner. Everything is done on the GitHub website or in GitHub Desktop. You never need a terminal.

## How it works

Whenever a change reaches the `main` branch, a GitHub "workflow" called **Deploy site** wakes up. It builds the site, runs its checks, and only then publishes to GitHub Pages. Your site at https://babatundeawo.github.io/ updates about a minute later.

A change on any other branch, or in a pull request, is built and checked by **Check pull request** but is **never published**. The live site stays safe until you decide.

Two more jobs run beside this:

- **Quality report**: HTML lint, link check and a mobile Lighthouse report. These are for information and never stop a deployment.
- **CodeQL**: a weekly and per-change security scan.

## One-time setup

1. Open https://github.com/babatundeawo/babatundeawo.github.io and sign in.
2. Click **Settings** (the tab with the gear icon).
3. In the left menu click **Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. In **Settings > Code security** switch on **Dependabot alerts**, **Secret scanning** and **Push protection**.

The repository must stay **public**: GitHub Pages on the Free plan does not publish private repositories.

## Publishing a change safely (pull request)

1. In GitHub Desktop choose **Current Branch > New Branch**, name it (for example `update-site`) and click **Create Branch**.
2. Make your changes in the folder, then in GitHub Desktop write a short summary, click **Commit to update-site**, then **Publish branch**.
3. Click **Create Pull Request**. Your browser opens GitHub.
4. On the pull request page wait for the green ticks under **Checks**. A red cross means something is wrong; click **Details** and read the last lines.
5. To look at the new site first: click **Actions**, open the newest **Check pull request** run, scroll to **Artifacts** and click **site-preview**. Unzip the download and open `index.html`. Pages that need the internet or the service worker (offline mode, install) only work on the live site.
6. Happy? Click **Merge pull request**, then **Confirm merge**.
7. Click **Actions**: the newest **Deploy site** run should show a green tick in a couple of minutes.

## Checking a deployment

1. Click the **Actions** tab and open the newest run named **Deploy site**.
   - Green tick: published.
   - Red cross: nothing was changed on the live site. Click the run, click the step with the red cross and read the last lines. A message such as `missing file for "assets/images/x.jpg"` means a page points at a file that was not uploaded.
   - Yellow dot: still running.
2. If the **Read the GitHub Pages settings** step fails, Pages is not set to **GitHub Actions** yet (see One-time setup).
3. The live address appears in the **Publish to GitHub Pages** step.

## What visitors see after an update

The site saves its pages on each visitor's device so it can work offline. When you publish, visitors who already have the site get a small notice, **A new version of this site is ready**, with **Refresh** and **Later** buttons. New visitors always get the newest version. Nobody is stuck on an old version: closing and reopening the site also picks it up.

## Updating content later

1. Open the file on GitHub (for example `index.html`) and click the pencil icon.
2. Make the change, click **Commit changes** and choose **Commit directly to the main branch**.
3. The site republishes by itself. See [CUSTOMIZING.md](CUSTOMIZING.md) for where things live.

To add a project, copy one whole `<li class="reveal"> ... </li>` block inside `projects.html`, paste it into the right group and change the text and links.

## Rolling back

1. Click **Pull requests**, then **Closed**, and open the pull request you want to undo.
2. Click **Revert**. GitHub prepares a new pull request that undoes it.
3. Click **Create pull request**, wait for the green ticks, then **Merge pull request**. The site republishes with the earlier version.

If a change was saved straight to `main` (no pull request), open **Commits**, click the bad commit and use **Revert** there.

## Connecting a custom domain (optional)

1. Buy a domain from any registrar.
2. In the repository open **Settings > Pages**, type the domain under **Custom domain** and click **Save**.
3. At your registrar add the DNS records shown in GitHub's help page "Managing a custom domain for your GitHub Pages site": four `A` records for the bare domain and a `CNAME` record for `www`.
4. When it becomes available tick **Enforce HTTPS**.
5. Nothing needs editing in the files. The deploy step reads the real address from GitHub and updates the canonical links, social preview addresses, sitemap and robots file by itself. Add the new domain to the project sites that link back to you if they use absolute addresses.

## Security notes

- GitHub Pages cannot set HTTP response headers, so each page carries a Content-Security-Policy and a referrer policy in `<meta>` tags. Headers that only a server can send (for example `frame-ancestors`, `X-Content-Type-Options`, `Permissions-Policy`) cannot be set on this host.
- **Dependabot** opens a pull request when a newer version of a workflow step exists. Merge it when its checks are green.
- **CodeQL** results appear under **Security > Code scanning**.

## Sharing the web address with your other projects

Every project at `babatundeawo.github.io/<name>/` shares this site's address. The service worker is built to touch only this site's own files, and the saved theme choice is stored under its own name (`ba-theme`). Project sites that have no service worker of their own open normally while online; while offline they show this site's offline page.

When the installed app is open, links to those project sites open inside the app window, because they live under the same address.

## Redirects

No page addresses changed (`index.html`, `projects.html` and `404.html` are as before). GitHub Pages cannot send true 301 redirects; if a page is ever moved, leave a small page at the old address with a `<meta http-equiv="refresh">`, a visible link and a canonical link to the new one.
