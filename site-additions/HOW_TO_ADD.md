# Add the delay time calculator page to amanorsac.studio

## What this is

`delay-time-calculator.html` — a standalone page targeting the highest-volume
search in this niche ("delay time calculator", "bpm to ms", "delay chart").
It reuses your site's own font preloads, `<style>` block and footer, so it
matches every other page with no CSS changes.

## Install

1. Upload `delay-time-calculator.html` to your site root (next to `pulseroom.html`).
   If your host maps clean URLs, it will serve at `/delay-time-calculator`.
2. Add the URL to `sitemap.xml`:

   ```xml
   <url><loc>https://amanorsac.studio/delay-time-calculator</loc></url>
   ```

3. Link to it from `pulseroom.html` (internal links pass ranking signal and help
   people find the tool). A sentence in the delay section works well:

   ```html
   <p>Prefer to check a value without opening the app?
      Use the <a href="delay-time-calculator.html">delay time calculator</a>.</p>
   ```

4. Optional: link it from `apps.html` and the blog posts about mixing.

## What is on the page

- Interactive calculator (delay + reverb pre-delay/decay), no dependencies
- Static delay chart for 16 common tempos — indexable text, this is what ranks
  for long-tail searches like "delay time 128 bpm"
- "Which delay time should you use" explainer, Haas and slapback guidance
- FAQ with FAQPage schema (earns expandable results in Google)
- WebApplication + BreadcrumbList schema, canonical, Open Graph and Twitter cards
- Links back to `pulseroom.html` and the download page

## After uploading

- Submit the URL in Google Search Console (URL Inspection -> Request indexing).
- Check the FAQ/rich result preview: https://search.google.com/test/rich-results
