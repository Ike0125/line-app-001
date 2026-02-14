const DEFAULT_FIXED_MESSAGE = "中止の場合は、当日の朝８時までに掲示します";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEventNoticeHtml(params: {
  status: string;
  eventTitle?: string | null;
  message?: string | null;
}) {
  const { status, eventTitle, message } = params;

  if (status === "非表示") {
    return `<!doctype html><html><body></body></html>`;
  }

  const safeEvent = eventTitle ? escapeHtml(eventTitle) : "";
  const mergedMessage =
    status === "初期設定"
      ? (message?.trim()
          ? `${DEFAULT_FIXED_MESSAGE}\n${message}`
          : DEFAULT_FIXED_MESSAGE)
      : (message ?? "");

  const safeMsg = mergedMessage
    ? escapeHtml(mergedMessage).replaceAll("\n", "<br>")
    : "";

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: sans-serif; margin: 0; padding: 16px; }
.notice { border-left: 6px solid #3b82f6; padding: 12px; background: #f8fafc; }
.title { font-weight: bold; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="notice">
  ${safeEvent ? `<div class="title">${safeEvent}</div>` : ""}
  ${safeMsg}
</div>
</body>
</html>
`;
}
