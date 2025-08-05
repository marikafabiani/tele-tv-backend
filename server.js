const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = 21265247; // <-- il tuo
const apiHash = "572a526a1c9289e6c37be3e6581cc454"; // <-- il tuo

// Legge la sessione salvata
const sessionData = JSON.parse(fs.readFileSync("session.json"));
const stringSession = new StringSession(sessionData.session);

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

const app = express();
app.use(cors());
app.use(express.json());

(async () => {
  await client.connect(); // usa sessione salvata
  console.log("✅ Collegato a Telegram via sessione");

  // Route: elenco chat
  app.get("/chats", async (req, res) => {
    try {
      const dialogs = await client.getDialogs();
      const result = dialogs.map((dialog) => ({
        id: dialog.id.toString(),
        title: dialog.title,
        type: dialog.isChannel ? "channel" : dialog.isGroup ? "group" : "user",
      }));
      res.json(result);
    } catch (err) {
      console.error("Errore nel recupero chat:", err);
      res.status(500).json({ error: "Errore nel recupero chat" });
    }
  });

  // Route: messaggi di una chat
  app.get("/messages/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const messages = await client.getMessages(chatId, { limit: 20 });

      const videoMessages = messages.map((msg) => {
        let file_type = null;
        let file_name = null;

        if (msg.media && msg.media.document) {
          file_type = msg.media.document.mimeType || null;

          const nameAttr = msg.media.document.attributes.find(
            (attr) => attr.fileName
          );
          file_name = nameAttr?.fileName || `video-${msg.id}.mp4`;
        }

        return {
          id: msg.id,
          message: msg.message,
          hasMedia: !!msg.media,
          file_type,
          file_name,
          date: new Date(msg.date * 1000).toISOString(),
          isVideo: file_type?.startsWith("video/"),
        };
      });

      res.json(videoMessages);
    } catch (err) {
      console.error("Errore nel recupero messaggi:", err);
      res.status(500).json({ error: "Errore nel recupero messaggi" });
    }
  });

  const fs = require("fs");
  const path = require("path");

  app.get("/download/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      const dialogs = await client.getDialogs({ limit: 50 });

      for (const dialog of dialogs) {
        const messages = await client.getMessages(dialog.id, {
          ids: [parseInt(messageId)],
        });
        const message = messages[0];

        if (message && message.media && message.media.document) {
          const document = message.media.document;
          const mimeType = document.mimeType || "application/octet-stream";
          const extension = mimeType.split("/")[1] || "mp4";

          const nameAttr = document.attributes.find((attr) => attr.fileName);
          const baseName =
            nameAttr?.fileName?.replace(/\.[^/.]+$/, "") ||
            `video-${message.id}`;

          // ✅ LOGICA PERSONALIZZATA: aggiungi estensione solo se non è un video Telegram "nativo"
          const isTelegramVideo = message.media.video === true;
          const finalName = isTelegramVideo
            ? `${baseName}`
            : `${baseName}.${extension}`;

          const tempDir = path.join(__dirname, "temp");
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

          const tempFilePath = path.join(tempDir, finalName);

          await client.downloadMedia(message.media, {
            outputFile: tempFilePath,
          });

          return res.download(tempFilePath, finalName, (err) => {
            if (err) {
              console.error("Errore nel download:", err);
            }
            fs.unlink(tempFilePath, (unlinkErr) => {
              if (unlinkErr) console.error("Errore rimozione file:", unlinkErr);
            });
          });
        }
      }

      res.status(404).send("Messaggio non trovato.");
    } catch (err) {
      console.error("Errore generale:", err);
      res.status(500).send("Errore durante il download.");
    }
  });

  app.listen(3001, "0.0.0.0", () => {
    console.log("🚀 Backend Telegram API in ascolto su http://localhost:3001");
  });
})();
