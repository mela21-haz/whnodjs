// Requiere instalar estos módulos:
// npm install express discord.js body-parser

const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ======== CONFIGURACIÓN =========
const BOT_TOKEN = 'MTM2NTc4ODcyNjUyMDcwOTIxMg.G275GU.RzN14pH7GZFz_e0H7YCCs08cDrOg9BRmEH4yyA'; // 
const CANAL_REVISION_ID = '1365783819298537492';
const CANAL_APROBADOS_ID = '1365775118978256896';
const ROL_WHITELIST_ID = '1266819978183704710';
// =================================

// Map para controlar envíos (Discord ID -> timestamp último envío)
const submissions = new Map();

// Inicializar cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Servir archivos estáticos (logo, CSS externos, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Express para recibir datos de formulario
app.use(bodyParser.urlencoded({ extended: true }));

// Página de formulario
app.get('/', (req, res) => {
    res.send(`
    <html>
    <head>
        <title>Whitelist Application</title>
        <style>
            body {
                background-color:rgb(13, 127, 180);
                color: #003c8f;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
            }
            .logo img {
                max-width: 200px;
                margin-bottom: 20px;
            }
            input, textarea, select {
                width: 300px;
                padding: 10px;
                margin: 10px 0;
                border-radius: 8px;
                border: 1px solid #81d4fa;
                background-color: #e1f5fe;
                color: #003c8f;
            }
            button {
                background-color: #03a9f4;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
            }
            button:hover {
                background-color: #0288d1;
            }
        </style>
    </head>
    <body>
        <div class="logo">
            <img src="/logo.png" alt="Logo">
        </div>
        <h1>Aplicación de Whitelist</h1>
        <form action="/submit" method="post">
            <label for="nombre">¿Cuál es tu nombre?</label><br/>
            <input name="nombre" required/><br/>
            <label for="edad">¿Qué edad tienes?</label><br/>
            <input name="edad" required/><br/>
            <label for="discord">Discord ID (e.g., 8590533018504706)</label><br/>
            <input name="discord" required/><br/>
            <label for="queesvpr">¿Qué es VDM?</label><br/>
            <input name="queesvpr" required/><br/>
            <label for="queesrk">¿Qué es MG?</label><br/>
            <input name="queesrk" required/><br/>
            <label for="valoralavida">Explica cómo valorar tu vida en GYERP</label><br/>
            <textarea name="valoralavida" required></textarea><br/>
            <label for="matarvehiculo">¿Puedes matar dentro de un vehiculo o en GYERP?</label><br/>
            <textarea name="matarvehiculo" required></textarea><br/>
            <label for="trabajosilegales">¿Puedes ser parte de trabajos legales mientras estas en el lado ilegal en GYERP?</label><br/>
            <textarea name="trabajosilegales" required></textarea><br/>
            <label for="respeto">¿Puedes faltar el respeto por cultura/nacionalidad/color en GYERP?</label><br/>
            <textarea name="respeto" required></textarea><br/>
            <label for="roleararresto">¿Qué harías si tu amigo está siendo arrestado por la policía y hay médicos en el lugar?</label><br/>
            <textarea name="roleararresto" required></textarea><br/>
            <label for="violacion">¿Puedes faltarle el respeto a una mujer, cometer una violación en el servidor o intentar forzarla a realizar cualquier tipo de actividad sexual?</label><br/>
            <textarea name="violacion" required></textarea><br/>
            <label for="vinculado">¿Vinculado a cfx.re?</label><br/>
            <select name="vinculado">
                <option value="Sí">Sí</option>
                <option value="No">No</option>
            </select><br/>
            <label for="queespg">¿Qué es PG?</label><br/>
            <textarea name="queespg" required></textarea><br/>
            <button type="submit">Enviar</button>
        </form>
    </body>
    </html>
    `);
});

// Cuando se envía el formulario
app.post('/submit', async (req, res) => {
    const datos = req.body;
    const now = Date.now();
    const last = submissions.get(datos.discord);

    // Verificar límite de 24 horas
    if (last && (now - last) < 24 * 60 * 60 * 1000) {
        const remainingMs = 24 * 60 * 60 * 1000 - (now - last);
        const hours = Math.floor(remainingMs / 3600000);
        const minutes = Math.floor((remainingMs % 3600000) / 60000);
        return res.send(`Solo puedes enviar una solicitud cada 24 horas. Inténtalo de nuevo en ${hours}h ${minutes}m.`);
    }
    // Registrar envío actual
    submissions.set(datos.discord, now);

    const canal = await client.channels.fetch(CANAL_REVISION_ID);
    if (!canal) return res.send('Error enviando al canal de revisión.');

    const embed = new EmbedBuilder()
        .setTitle('Nueva Solicitud de Whitelist')
        .setColor('#03a9f4')
        .addFields(
            { name: 'Nombre', value: datos.nombre, inline: true },
            { name: 'Edad', value: datos.edad, inline: true },
            { name: 'Discord ID', value: datos.discord, inline: true },
            { name: '¿Qué es VDM?', value: datos.queesvpr },
            { name: '¿Qué es MG?', value: datos.queesrk },
            { name: 'Valoración de Vida', value: datos.valoralavida },
            { name: 'Matar bajando de vehículo', value: datos.matarvehiculo },
            { name: 'legal mientras este ilegal', value: datos.trabajosilegales },
            { name: 'Respeto cultural', value: datos.respeto },
            { name: 'Rol de arresto', value: datos.roleararresto },
            { name: 'Violación o forzar actividades', value: datos.violacion },
            { name: 'Vinculado CFX', value: datos.vinculado },
            { name: '¿Qué es PG?', value: datos.queespg }
        )
        .setTimestamp();

    const botones = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('aceptar')
                .setLabel('Aceptar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('rechazar')
                .setLabel('Rechazar')
                .setStyle(ButtonStyle.Danger)
        );

    await canal.send({ embeds: [embed], components: [botones] });
    res.send('Formulario enviado correctamente. ¡Gracias!');
});

// Bot escucha los botones
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const originalEmbed = interaction.message.embeds[0];
    const discordField = originalEmbed.fields.find(f => f.name === 'Discord ID');
    const solicitanteId = discordField?.value;
    const miembro = solicitanteId ? await interaction.guild.members.fetch(solicitanteId).catch(() => null) : null;
    const staff = interaction.user;

    if (interaction.customId === 'aceptar') {
        if (miembro) await miembro.roles.add(ROL_WHITELIST_ID).catch(console.error);
        const canalAprobados = await client.channels.fetch(CANAL_APROBADOS_ID);
        if (canalAprobados) {
            const embedAprobado = new EmbedBuilder()
                .setTitle('✅ Whitelist Aprobada')
                .setColor('#00bfff')
                .setDescription('¡Felicidades!')
                .addFields(
                    { name: 'Usuario', value: `<@${solicitanteId}>`, inline: true },
                    { name: 'Discord ID', value: solicitanteId, inline: true },
                    { name: 'Staff que aprobó', value: `<@${staff.id}>`, inline: true }
                )
                .setImage('https://r2.fivemanage.com/PJDwcJBxdtv29rgZuuqbt/Aprobado.png')
                .setTimestamp();
            await canalAprobados.send({ embeds: [embedAprobado] });
        }
        await interaction.update({ content: '✅ Solicitud aprobada.', embeds: [], components: [] });
    }

    if (interaction.customId === 'rechazar') {
        const canalAprobados = await client.channels.fetch(CANAL_APROBADOS_ID);
        if (canalAprobados) {
            const embedRechazado = new EmbedBuilder()
                .setTitle('❌ Whitelist Rechazada')
                .setColor('#ff0000')
                .setDescription('Lo siento.')
                .addFields(
                    { name: 'Usuario', value: `<@${solicitanteId}>`, inline: true },
                    { name: 'Discord ID', value: solicitanteId, inline: true },
                    { name: 'Staff que rechazó', value: `<@${staff.id}>`, inline: true }
                )
                .setImage('https://r2.fivemanage.com/PJDwcJBxdtv29rgZuuqbt/RECHAZADO.png')
                .setTimestamp();
            await canalAprobados.send({ embeds: [embedRechazado] });
        }
        await interaction.update({ content: '❌ Solicitud rechazada.', embeds: [], components: [] });
    }
});

// Iniciar bot y servidor web
client.login(BOT_TOKEN);
app.listen(PORT, () => console.log(`Servidor web corriendo en http://localhost:${PORT}`));