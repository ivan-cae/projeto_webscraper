const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const axios = require('axios');
const twilio = require('twilio');
const cors = require('cors');


const app = express();
app.use(bodyParser.json());
const { Sequelize, DataTypes } = require('sequelize');

let precos = [];

const corsOptions = {
  origin: ['http://frontend:80', 'http://localhost:8001'],
};

app.use(cors(corsOptions));


const db = new sqlite3.Database('./Acompanhamentos.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Acompanhamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor_alerta REAL,
    notifica_email BOOLEAN DEFAULT 0,
    email TEXT DEFAULT "",
    notifica_sms BOOLEAN DEFAULT 0,
    telefone TEXT DEFAULT "",
    alerta_acima BOOLEAN DEFAULT 1
  )`);
});

//Necessário adicionar as credenciais do twilio e do email para os serviços de notificação funcionarem
/*const SMTP_SERVER = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_USER = "**";
const SMTP_PASSWORD = "**";

const TWILIO_SID = "**";
const TWILIO_AUTH_TOKEN = "**";
const TWILIO_PHONE_NUMBER = "**";
*/


const transporter = nodemailer.createTransport({
    host: SMTP_SERVER,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
    }
});

function enviaEmail(toEmail, subject, body, id) {
    const mailOptions = {
        from: SMTP_USER,
        to: toEmail,
        subject: subject,
        text: body
    };

    return transporter.sendMail(mailOptions)
        .then(info => {
            console.log('E-mail enviado:', info.response);
            desligaAlertaEmail(id)
            return true;
        })
        .catch(error => {
            console.error('Erro ao enviar e-mail:', error);
            return false;
        });
}

function enviaSMS(toPhone, body, id) {
    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
    toPhone = toPhone.replace(/[()\-\s]/g, '');

    return client.messages.create({
        body: body,
        from: TWILIO_PHONE_NUMBER,
        to: toPhone
    })
    .then(message => {
        console.log('SMS enviado:', message.sid);
        desligaAlertaSMS(id)
        return true;
    })
    .catch(error => {
        console.error('Erro ao enviar SMS:', error);
        return false;
    });
}

async function obterPrecoBitcoin() {
  try {
    const response = await axios.get('http://scraper:9000/preco_bitcoin');

    if (response.status !== 200) {
      throw new Error(`HTTP Status: ${response.status}`);
    }

    return response.data.preco;
  } catch (error) {
    console.error('Erro ao obter o preço do Bitcoin:', error.message);
    throw new Error('Erro ao obter o preço do Bitcoin');
  }
}


app.get('/preco_bitcoin', async (req, res) => {
  try {
      const preco = await obterPrecoBitcoin();
      res.json(preco);
  } catch (error) {
      res.status(500).send(error.message);
  }
});

async function verificarAlertas() {
  
      const preco = await obterPrecoBitcoin();
      console.log('Preço do Bitcoin:', preco);

      const timestamp = new Date().toISOString();
  precos.push({ preco, timestamp });

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 2);
  precos = precos.filter(entry => new Date(entry.timestamp) >= cutoff);

  db.all('SELECT * FROM Acompanhamentos', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar acompanhamentos:', err.message);
      return;
    }

    rows.forEach(async (acompanhamento) => {
      const { id, valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima } = acompanhamento;

      let condicaoAlerta = alerta_acima ? (preco >= valor_alerta) : (preco <= valor_alerta);

      
      if (condicaoAlerta) {
        if (notifica_email && email) { 
          await enviaEmail(email, 'Alerta de Bitcoin', `O valor do Bitcoin atingiu o alerta configurado: $${preco}`, id);
        }
        if (notifica_sms && telefone) {
          await enviaSMS(telefone, `O valor do Bitcoin atingiu o alerta configurado: $${preco}`, id);

        }
      }
    });
  });  
}

app.get('/dados_bitcoin', (req, res) => {
  res.json(precos);
});

function desligaAlertaEmail(id){
  db.run(
    `UPDATE Acompanhamentos SET notifica_email = false WHERE id = ?`,
    [id],
  );
}


function desligaAlertaSMS(id){
  db.run(
    `UPDATE Acompanhamentos SET notifica_sms = false WHERE id = ?`,
    [id],
  );
}

app.get('/acompanhamentos/lista', (req, res) => {
  db.all('SELECT * FROM Acompanhamentos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/acompanhamentos/add', (req, res) => {
  const { valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima } = req.body;
  db.run(
    `INSERT INTO Acompanhamentos (valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima) VALUES (?, ?, ?, ?, ?, ?)`,
    [valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/acompanhamentos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM Acompanhamentos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Acompanhamento não encontrado' });
    }
    res.json(row);
  });
});

app.put('/acompanhamentos/:id', (req, res) => {
  const { id } = req.params;
  const { valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima } = req.body;
  db.run(
    `UPDATE Acompanhamentos SET valor_alerta = ?, notifica_email = ?, email = ?, notifica_sms = ?, telefone = ?, alerta_acima = ? WHERE id = ?`,
    [valor_alerta, notifica_email, email, notifica_sms, telefone, alerta_acima, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Acompanhamento não encontrado' });
      }
      res.json({ success: true });
    }
  );
});

app.delete('/acompanhamentos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Acompanhamentos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Acompanhamento não encontrado' });
    }
    res.json({ success: true });
  });
});

app.get('/historico_preco_bitcoin', async (req, res) => {
    try {
        const data = await PrecoBitcoin.findAll({
            where: {
                timestamp: {
                    [Sequelize.Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
            },
            order: [['timestamp', 'ASC']]
        });

        res.json(data.map(entry => ({
            preco: entry.preco,
            timestamp: entry.timestamp
        })));
    } catch (error) {
        res.status(500).send('Erro ao obter dados históricos: ' + error.message);
    }
});

setInterval(verificarAlertas, 30 * 1000);

app.listen(8000, () => {
  console.log('Servidor rodando na porta 8000');
});
