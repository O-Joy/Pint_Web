// src/config/mailer.js
// Configura o cliente de email usando as credenciais do .env
// O transporter é o objeto que sabe como ligar ao servidor SMTP e enviar emails
// Criamos apenas uma instância e reutilizamos em todo o projeto (padrão singleton)

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       // smtp.office365.com
  port: parseInt(process.env.EMAIL_PORT), // 587
  secure: false, // false para porta 587 (STARTTLS) — true seria para porta 465 (SSL)
  auth: {
    user: process.env.EMAIL_USER,     // o teu email de aluno
    pass: process.env.EMAIL_PASS,     // a tua password
  },
  tls: {
    // O Office365 às vezes tem problemas de certificado — esta opção resolve
    ciphers: 'SSLv3',
  },
})

module.exports = transporter