const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PAYMENTS_ENABLED =
  String(process.env.PAYMENTS_ENABLED || "false").toLowerCase() === "true";

// Admin credentials — productionలో .env ద్వారా మార్చాలి
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const state = {
  tournaments: [
    {
      id: 1,
      name: "Night Warriors #01",
      mode: "FULL_MAP",
      entry: 10,
      slots: 40,
      joined: 32,
      status: "LIVE",
      start: "Today 8:00 PM"
    },
    {
      id: 2,
      name: "Victory Clash #02",
      mode: "CLASH_SQUAD",
      entry: 20,
      slots: 24,
      joined: 18,
      status: "UPCOMING",
      start: "Tomorrow 6:00 PM"
    }
  ],

  wallet: {
    deposit: 500,
    winning: 250
  },

  banners: [
    {
      id: 1,
      title: "Festival Special",
      position: "TOP",
      rotation: 3,
      active: true
    }
  ],

  complaints: []
};

// =========================
// HEALTH
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "freefire-victory-backend",
    paymentsEnabled: PAYMENTS_ENABLED
  });
});

// =========================
// ADMIN LOGIN
// =========================

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    return res.json({
      ok: true,
      message: "Login successful"
    });
  }

  return res.status(401).json({
    ok: false,
    error: "INVALID_CREDENTIALS"
  });
});

// =========================
// PAYMENT SETTINGS
// =========================

app.get("/api/payment-settings", (req, res) => {
  res.json({
    enabled: PAYMENTS_ENABLED
  });
});

// =========================
// TOURNAMENTS
// =========================

app.get("/api/tournaments", (req, res) => {
  res.json(state.tournaments);
});

app.post("/api/tournaments", (req, res) => {
  const b = req.body || {};

  const tournament = {
    id: Date.now(),
    name: b.name || "New Tournament",
    mode: b.mode || "FULL_MAP",
    entry: Number(b.entry || 10),
    slots: Number(b.slots || 40),
    joined: 0,
    status: "UPCOMING",
    start: b.start || ""
  };

  state.tournaments.push(tournament);

  res.status(201).json(tournament);
});

app.post("/api/tournaments/:id/join", (req, res) => {
  const tournament = state.tournaments.find(
    x => x.id === Number(req.params.id)
  );

  if (!tournament) {
    return res.status(404).json({
      error: "Tournament not found"
    });
  }

  if (tournament.joined >= tournament.slots) {
    return res.status(409).json({
      error: "FULL"
    });
  }

  if (state.wallet.deposit < tournament.entry) {
    return res.status(402).json({
      error: "INSUFFICIENT_WALLET"
    });
  }

  state.wallet.deposit -= tournament.entry;
  tournament.joined++;

  res.json({
    ok: true,
    tournament,
    wallet: state.wallet
  });
});

// =========================
// WALLET
// =========================

app.get("/api/wallet", (req, res) => {
  res.json(state.wallet);
});

// =========================
// DEPOSIT
// =========================

app.post("/api/wallet/deposit", (req, res) => {
  if (!PAYMENTS_ENABLED) {
    return res.status(503).json({
      error: "PAYMENTS_DISABLED"
    });
  }

  const amount = Number(req.body?.amount || 0);

  if (amount < 10) {
    return res.status(400).json({
      error: "MINIMUM_DEPOSIT_10"
    });
  }

  state.wallet.deposit += amount;

  res.json({
    ok: true,
    wallet: state.wallet
  });
});

// =========================
// WITHDRAW
// =========================

app.post("/api/withdraw", (req, res) => {
  const source = req.body?.source;
  const amount = Number(req.body?.amount || 0);

  if (amount < 100) {
    return res.status(400).json({
      error: "MINIMUM_WITHDRAWAL_100"
    });
  }

  // Winning balance withdrawal — 0% fee
  if (source === "WINNING") {
    if (state.wallet.winning < amount) {
      return res.status(400).json({
        error: "INSUFFICIENT_WINNING_BALANCE"
      });
    }

    state.wallet.winning -= amount;

    return res.json({
      ok: true,
      fee: 0,
      net: amount,
      wallet: state.wallet
    });
  }

  // Deposit balance return — 10% fee + admin approval
  if (source === "DEPOSIT") {
    if (state.wallet.deposit < amount) {
      return res.status(400).json({
        error: "INSUFFICIENT_DEPOSIT_BALANCE"
      });
    }

    const fee = amount * 0.10;
    const net = amount - fee;

    state.wallet.deposit -= amount;

    return res.json({
      ok: true,
      fee,
      net,
      wallet: state.wallet,
      approval: "ADMIN_REQUIRED"
    });
  }

  return res.status(400).json({
    error: "INVALID_SOURCE"
  });
});

// =========================
// BANNERS
// =========================

app.get("/api/banners", (req, res) => {
  res.json(state.banners);
});

app.post("/api/banners", (req, res) => {
  const banner = {
    id: Date.now(),
    title: req.body?.title || "Promotion",
    position: req.body?.position || "TOP",
    rotation: Number(req.body?.rotation || 3),
    active: true
  };

  state.banners.push(banner);

  res.status(201).json(banner);
});

// =========================
// COMPLAINTS
// =========================

app.get("/api/complaints", (req, res) => {
  res.json(state.complaints);
});

app.post("/api/complaints", (req, res) => {
  const complaint = {
    id: Date.now(),
    player: req.body?.player || "Player",
    issue: req.body?.issue || "Support request",
    status: "OPEN"
  };

  state.complaints.push(complaint);

  res.status(201).json(complaint);
});

// =========================
// STATIC PAGES
// =========================

app.use(
  "/web",
  express.static(path.join(__dirname, "../apps/web"))
);

app.use(
  "/admin",
  express.static(path.join(__dirname, "../apps/admin"))
);

app.use(
  "/app",
  express.static(path.join(__dirname, "../apps/player"))
);

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `FREEFIRE VICTORY backend running on http://localhost:${PORT}`
  );
});