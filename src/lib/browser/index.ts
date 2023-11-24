export function createPage(content: string) {
  const win = window.open('')
  win?.document.write(content)
  return win
}

export const renderPage = (
  title: string,
  content: string,
  style = ''
) => `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${style}
  </style>
</head>
<body>
  ${content}
</body>
</html>`