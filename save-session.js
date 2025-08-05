const fs = require("fs");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = 21265247;
const apiHash = "572a526a1c9289e6c37be3e6581cc454";
const stringSession = new StringSession("");

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Numero di telefono: "),
    password: async () => await input.text("Password 2FA: "),
    phoneCode: async () => await input.text("Codice OTP: "),
    onError: (err) => console.log("Errore:", err),
  });

  const session = client.session.save();
  fs.writeFileSync("session.json", JSON.stringify({ session }, null, 2));
  console.log("Sessione salvata in session.json");
})();
