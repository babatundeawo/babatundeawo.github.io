# Deployment guide

This guide is for the site owner. Everything is done on the GitHub website. You never need to install anything or open a terminal.

## How it works

Whenever a change is saved to the `main` branch, a GitHub "workflow" called **Deploy site** wakes up, checks the files, and publishes them to GitHub Pages. Your site at https://babatundeawo.github.io/ updates about a minute later.

Changes made on any other branch, or in a pull request, are checked but **never published**. That is what keeps the live site safe until you decide.

## One-time setup (do this once, before the first merge)

1. Open https://github.com/babatundeawo/babatundeawo.github.io in your browser and sign in.
2. Click **Settings** (the tab with the gear icon, near the top right of the repository).
3. In the left menu click **Pages**.
4. Under **Build and deployment**, find **Source** and choose **GitHub Actions** from the drop-down.
5. You should see the choice saved. Nothing else needs changing on this page.

Optional but recommended: in **Settings > Code security** switch on **Secret scanning** and **Push protection**. These warn you if a password or key is ever saved in the repository by mistake.

## Reviewing and publishing the redesign (pull request)

The redesign arrives as a **pull request**: a proposed set of changes you can inspect before accepting.

1. Click the **Pull requests** tab and open the pull request titled for the redesign.
2. Click the **Checks** tab (or scroll to the bottom of the conversation) and wait for the green ticks. A yellow dot means it is still running.
3. To look at the new site before publishing: click **Actions** (top menu), open the newest run for the pull request, scroll to **Artifacts** at the bottom, and click **site-preview**. A zip file downloads. Unzip it (double-click it) and open `index.html` in your browser. The 404 page only looks right on the live site, so ignore it in the preview.
4. If you are happy, go back to the pull request and click the green **Merge pull request** button, then **Confirm merge**.
5. Click the **Actions** tab. The newest **Deploy site** run should show a green tick within a couple of minutes. Open https://babatundeawo.github.io/ and refresh.
6. If you do not like it, click **Close pull request** instead. The live site stays exactly as it was.

## Updating content later

1. Open the file on GitHub (for example `index.html`).
2. Click the pencil icon (**Edit this file**).
3. Make the change, click **Commit changes**, and choose **Commit directly to the main branch**.
4. The site republishes by itself. See [CUSTOMIZING.md](CUSTOMIZING.md) for where things live.

To add a project, copy one whole `<li class="reveal"> ... </li>` block inside `projects.html`, paste it into the right group, and change the text and links.

## Checking that a deployment worked

1. Click the **Actions** tab.
2. Find the newest run named **Deploy site**.
   - Green tick: published.
   - Red cross: something is wrong; the live site was **not** changed.
   - Yellow dot: still running.
3. To see what went wrong, click the run, click the step with the red cross, and read the last few lines. A message such as `missing file for "assets/images/x.jpg"` means a page points at a file that was not uploaded; upload it or fix the name and commit again.

The **Quality report** job shows lint, link and Lighthouse results. Warnings there never stop a deployment. Opening its steps tells you about broken external links or slow pages.

## Rolling back to an earlier version

Every version is kept in the history, so nothing is ever lost.

1. Click the **Pull requests** tab, then **Closed**, and open the pull request you want to undo.
2. Click the **Revert** button near the top. GitHub creates a new pull request that undoes it.
3. Click **Create pull request**, then **Merge pull request**. The site republishes with the earlier version.

If there is no Revert button, open the **Commits** list (on the main page of the repository click the clock icon labelled with a number of commits), click the last good commit, and use the button on its right to browse the files. Copy the text of a file you want back, then edit the current file and paste.

## Connecting a custom domain (optional)

1. Buy a domain from any registrar.
2. In the repository open **Settings > Pages**, type the domain under **Custom domain** and click **Save**.
3. At your registrar add the DNS records GitHub shows in its help page "Managing a custom domain for your GitHub Pages site": four `A` records for the bare domain and a `CNAME` record for `www`.
4. Back on the Pages settings, tick **Enforce HTTPS** once it becomes available (it can take up to a day).
5. Edit the web addresses inside `index.html`, `projects.html`, `sitemap.xml` and `robots.txt` that start with `https://babatundeawo.github.io` so they use the new domain. This keeps search engines and link previews correct.

## Automatic security upkeep

- **Dependabot** opens a pull request when a newer version of an automation step is available. Merge it when its checks are green.
- **CodeQL** scans the code weekly and on every change. Results appear under **Security > Code scanning**.
- Hosting on GitHub Pages does not let a site set its own response headers, so the pages carry a Content Security Policy in a `<meta>` tag instead.

## Redirects

No page addresses changed (`index.html` and `projects.html` are unchanged), so no redirects were needed. GitHub Pages cannot send true 301 redirects. If a page is ever moved, leave a small page at the old address that contains a `<meta http-equiv="refresh">` pointing to the new one.
