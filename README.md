# nolkee

A bilingual personal portfolio for nolkee / Jiabin Yin, focused on full-stack development, AI agents and computer vision.

The page combines editorial typography with a small interactive CSS graphic. It runs as plain HTML, CSS and JavaScript, with local images and audio and no framework, dependency installation or runtime service.

- `index.html`: homepage content, project illustrations, album metadata and native listening dialog
- `portfolio/styles.css`: shared design tokens, responsive layout and reduced-motion support
- `portfolio/experience.js`: graphic interaction, chapter navigation, album arrangement and playback
- `portfolio/language.js` / `portfolio/theme.js`: persistent language and appearance preferences
- `content/`: archived Markdown from the previous blog, excluded from deployment

## Preview

Run `node preview-server.mjs`, then open `http://localhost:8871`.
The preview server supports HTTP byte ranges so audio can seek to any position.

## Deploy

Run `bash build.sh` to package the page and local assets into `public/`.
Vercel uses `vercel.json`; GitHub Pages uses the same files through the repository workflow.

## Content sources

Project descriptions were checked against the public repositories on 2026-10-06:

- [ECAFormer–ISB](https://github.com/Nolkee/ECAFormer_ISB): method, diagnostics and documented reproduction limits. The homepage does not present checkpoint metrics as independently reproduced results.
- [RailwayAnalysis](https://github.com/Nolkee/RailwayAnalysis): data, analysis and presentation layers, forecasting and clustering methods. Accuracy figures are not inferred from implementation scope.
- [Campus Assistant](https://github.com/AAAAxuuuuu/cqjtu-campus-assistant): upstream Flutter application. The portfolio identifies [Nolkee’s repository](https://github.com/Nolkee/cqjtu-campus-assistant) as a fork and attributes documented features to the upstream project.

Project artwork is a method or architecture illustration, rather than a product screenshot or benchmark chart. The music section preserves the existing selections, local audio and platform links.

The public contact address is `jiabinyy [at] outlook [dot] com`.
