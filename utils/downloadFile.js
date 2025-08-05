const fs = require("fs");
const os = require("os");
const path = require("path");

async function downloadTelegramMedia(client, messageId) {
  const dialogs = await client.getDialogs({ limit: 50 });

  for (const dialog of dialogs) {
    const messages = await client.getMessages(dialog.id, {
      ids: [parseInt(messageId)],
    });

    const message = messages[0];
    if (!message || !message.media?.document) continue;

    const document = message.media.document;
    const nameAttr = document.attributes.find((attr) => attr.fileName);
    const extension = document.mimeType?.split("/")[1] || "mp4";

    const filename = nameAttr?.fileName?.includes(".")
      ? nameAttr.fileName
      : `video-${messageId}.${extension}`;

    const tmpPath = path.join(os.tmpdir(), `temp-${messageId}.${extension}`);
    await client.downloadMedia(message.media, { outputFile: tmpPath });

    const stat = fs.statSync(tmpPath);

    return {
      filePath: tmpPath,
      filename,
      mimeType: document.mimeType || "application/octet-stream",
      size: stat.size,
    };
  }

  return null;
}

module.exports = { downloadTelegramMedia };
