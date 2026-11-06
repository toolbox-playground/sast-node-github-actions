// App de demo para o vídeo de SAST da TBX Tech.
// ATENÇÃO: este código tem vulnerabilidades PLANTADAS DE PROPÓSITO.
// Não use em produção. Não exponha na internet.

const express = require('express');
const { exec } = require('child_process');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// VULN 1 — secret hardcoded
const JWT_SECRET = 'tbx-super-secreto-123';

// VULN 2 — SQL injection: input do usuário concatenado na query
app.get('/usuarios', async (req, res) => {
  const nome = req.query.nome;
  const result = await pool.query("SELECT id, nome FROM usuarios WHERE nome = '" + nome + "'");
  res.json(result.rows);
});

// VULN 3 — command injection: input do usuário vai direto pro shell
app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec('ping -c 1 ' + host, (err, stdout) => {
    if (err) return res.status(500).send('erro');
    res.type('text/plain').send(stdout);
  });
});

app.post('/login', (req, res) => {
  const token = jwt.sign({ user: req.body.user }, JWT_SECRET);
  res.json({ token });
});

app.get('/health', (req, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`demo rodando na porta ${port}`));
