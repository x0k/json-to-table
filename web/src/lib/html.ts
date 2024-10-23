export function escapeHtml(unsafe: string) {
  return unsafe.replace(/[&<"']/g, function (m) {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case '"':
        return "&quot;";
      default:
        return "&#039;";
    }
  });
}

export const renderHTMLPage = (
  title: string,
  content: string,
  style = ""
) => `<!DOCTYPE html>
<html lang="en">
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
</html>`;
