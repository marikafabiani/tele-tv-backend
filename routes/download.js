const express = require("express");
const fs = require("fs");
const { downloadTelegramMedia } = require("../utils/downloadFile");

const router = express.Router();

router.get("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await downloadTelegramMedia(global.client, messageId); // o passalo come middleware

    if (!result) {
      return res.status(404).json({ error: "File non trovato" });
    }

    const { filePath, filename, mimeType, size } = result;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", size);

    const stream = fs.createReadStream(filePath);
    stream.on("close", () => fs.unlink(filePath, () => {}));
    stream.pipe(res);
  } catch (err) {
    console.error("Errore nel download:", err);
    res.status(500).json({ error: "Errore nel download" });
  }
});

module.exports = router;
