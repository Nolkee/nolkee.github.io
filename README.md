# nolkee

Personal portfolio for a Full-stack & AI Agent developer.

The site uses plain HTML, CSS and JavaScript with no framework, package install or build dependencies.

- `index.html`: portfolio page and bilingual content
- `portfolio/`: styles, interactions, album covers and audio
- `content/`: archived Markdown from the previous blog, excluded from deployment

## Preview

Run `python3 -m http.server 8871`, then open `http://localhost:8871`.

## Deploy

Run `bash build.sh` to copy the site into `public/`.
Vercel deploys `public/` using `vercel.json`. GitHub Pages uses the same files through the repository workflow.
