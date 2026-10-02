# Monashee Drilling Solutions Inc. — website preview

A single-page preview of the MDS website (the SRU solids removal unit and Uni-Line drilling fluids), built for review by
Doug Ashley. Plain HTML, CSS and a small vanilla script: no framework, no build step, no cookies, no analytics.
The only outside requests are the IBM Plex fonts from Google Fonts.

The preview carries `<meta name="robots" content="noindex, nofollow">` on every page so search engines leave it alone.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The site (sections 01 The SRU, 02 Uni-Line, 03 Field trial, 04 Requests) |
| `404.html` | Not-found page; self-contained, works on the GitHub Pages project URL and on a custom domain |
| `css/site.css` | All styles (`?v=` cache-buster in the link — bump it when the file changes) |
| `js/site.js` | Request form: type preselect, investor notice, validation, email composer (`?v=` as above) |
| `img/` | Only the photos the page uses, metadata stripped; favicons made from the MDS logo |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Preview locally

Open `index.html` in a browser (double-click). Everything works from disk, including the request form.

## How the request form works

There is no server. When a visitor presses **Prepare email to MDS**, the page opens the visitor's own email program with
a message to dougashley@monasheedrillingsolutions.com already filled in (subject `MDS request: <type>`, body with the
fields they entered). Nothing is stored on the website.

Links on the page preselect a request type with `data-request="rental | package | uni-line | investor"`. A link can
also preselect by URL: `index.html?request=uni-line#requests`.

### Switching the form to Formspree (or any form service)

1. Create a form at the service and copy its endpoint URL (for Formspree: `https://formspree.io/f/<id>`).
2. In `index.html`, add the attribute to the `<form id="request-form">` tag: `data-endpoint="https://formspree.io/f/<id>"`, and change its
   no-script fallback `action="mailto:..."` to the same URL (and remove `enctype="text/plain"`).
3. Bump the `?v=` number on `js/site.js` in `index.html`.

With `data-endpoint` present the script POSTs the fields to that URL and shows a confirmation; without it, it composes
the email. Update the Privacy paragraph to name the form service before switching, because enquiries would then pass
through that third party.

## Moving to monasheedrillingsolutions.com

1. Remove `<meta name="robots" content="noindex, nofollow">` from `index.html` and `404.html`, and remove the
   "Preview for review, not for distribution" cell from the footer.
2. In the GitHub repository settings, Pages, set the custom domain to `monasheedrillingsolutions.com` (this adds a
   `CNAME` file) and turn on "Enforce HTTPS".
3. At the domain registrar, point the domain at GitHub Pages (the `A` / `AAAA` records and the `www` `CNAME` listed in
   GitHub's Pages documentation), replacing the current parking page. Change only the web records: do NOT touch the
   `MX`, `SPF` (TXT) or `DKIM` records — they carry the company email.
4. In `index.html`, change `og:image` and `og:url` from the github.io preview address to the domain, e.g.
   `https://monasheedrillingsolutions.com/img/drillsite-1600.jpg` (link previews need a full URL).
5. `404.html` works out its own base path: on `*.github.io` it uses the first path segment, on the custom domain it uses `/`.

All links in the site are relative, so no other paths need to change.

## Before launch

Pre-launch review items are tracked outside this repository.
