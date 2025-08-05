const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = 21265247; // <-- inserisci il tuo
const apiHash = "572a526a1c9289e6c37be3e6581cc454"; // <-- inserisci il tuo

const stringSession = new StringSession(""); // Vuoto la prima volta

(async () => {
  console.log("▶️ Avvio login Telegram...");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () =>
      await input.text("📱 Inserisci il numero di telefono: "),
    password: async () => await input.text("🔒 Password 2FA (se c’è): "),
    phoneCode: async () => await input.text("💬 Codice OTP ricevuto: "),
    onError: (err) => console.log("❌ Errore:", err),
  });

  console.log("✅ Login riuscito!");
  const me = await client.getMe();
  console.log("👤 Utente:", me.username || me.firstName);

  const session = client.session.save();
  console.log("🔐 Sessione salvata:");
  console.log(session);
})();
