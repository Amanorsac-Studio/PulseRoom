# Publishing the showcase to the public repo

Run once, after creating the public repo `amanorsac/PulseRoom-app` on GitHub (empty, no README):

```bash
cd "/c/Reverb & Delay/showcase"
git init -b main
git add -A
git commit -m "PulseRoom showcase"
git remote add origin https://github.com/amanorsac/PulseRoom-app.git
git push -u origin main
```

To update the showcase later (after editing README.md or assets):

```bash
cd "/c/Reverb & Delay/showcase" && git add -A && git commit -m "Update showcase" && git push
```

Note: this folder is its own separate git repository, pointing at the PUBLIC repo.
The app source in the parent folder stays in the PRIVATE repo and is never pushed here.
