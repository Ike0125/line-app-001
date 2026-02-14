const DEFAULT_FIXED_MESSAGE = "中止の場合は、当日の朝８時までに掲示します";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusStyle(status: string) {
  switch (status) {
    case "開催":
      return { bg: "#e6f4ea", fg: "#1e4620", border: "#34a853", label: "【本日のイベントは開催します】" };
    case "中止":
      return { bg: "#fce8e6", fg: "#a50e0e", border: "#ea4335", label: "【本日のイベントは中止です】" };
    case "その他":
      return { bg: "#e8f0fe", fg: "#174ea6", border: "#4285f4", label: "【その他】" };
    case "初期設定":
      return { bg: "#f3f4f6", fg: "#111827", border: "#9ca3af", label: "【開催情報】" };
    case "メッセージのみ":
      return { bg: "#fff7ed", fg: "#7c2d12", border: "#fb923c", label: "【お知らせ】" };
    case "非表示":
      return { bg: "#ffffff", fg: "#111827", border: "#ffffff", label: "" };
    default:
      return { bg: "#f3f4f6", fg: "#111827", border: "#9ca3af", label: escapeHtml(status) };
  }
}

export function renderEventNoticeHtml(params: {
  status: string;
  eventTitle?: string | null;
  message?: string | null;
}) {
  const { status, eventTitle, message } = params;

  if (status === "非表示") {
    return "<!doctype html><html><head><meta charset=\"utf-8\"></head><body></body></html>";
  }

  const st = statusStyle(status);
  const showEvent = status !== "初期設定" && status !== "メッセージのみ";
  const showMessage = status !== "メッセージのみ";
  const mergedMessage =
    status === "初期設定"
      ? (message?.trim()
          ? `${DEFAULT_FIXED_MESSAGE}\n${message}`
          : DEFAULT_FIXED_MESSAGE)
      : (message ?? "");

  const safeEvent = eventTitle ? escapeHtml(eventTitle) : "";
  const safeMsg = mergedMessage ? escapeHtml(mergedMessage).replaceAll("\n", "<br>") : "";

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SWF 開催通知</title>
  <style>
    body { margin:0; padding:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif; }
    .wrap { padding: 10px; }
    .box {
      border-left: 6px solid ${st.border};
      background: ${st.bg};
      color: ${st.fg};
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.4;
    }
    .status { font-weight: 800; font-size: 18px; margin-bottom: 6px; }
    .event  { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
    .msg    { font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="box">
      <div class="status">${escapeHtml(st.label)}</div>
      ${showEvent && safeEvent ? `<div class="event">${safeEvent}</div>` : ""}
      ${showMessage && safeMsg ? `<div class="msg">${safeMsg}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
}
