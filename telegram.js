const TelegramBot = require('node-telegram-bot-api');
const {readFileSync, writeFileSync, existsSync, mkdirSync} = require('fs')

require('dotenv').config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// const API_URL = "http://localhost:3000/api/openai/dialogue"
const API_URL = "https://api.amadao.network/api/openai/dialogue"

const DIALOGUES_PATH = "./dialogues"
const AUDIOS_PATH = "./audios"
function loadDialogue(chatId) {
    const filePath = `${DIALOGUES_PATH}/${chatId}.txt`;
    if (!existsSync(filePath)) return []
    return JSON.parse(readFileSync(filePath).toString())
}

function saveDialogue(chatId, dialogue = {}) {
    if (!existsSync(DIALOGUES_PATH)) {
        mkdirSync(DIALOGUES_PATH)
    }
    const filePath = `${DIALOGUES_PATH}/${chatId}.txt`;
    writeFileSync(filePath, JSON.stringify(dialogue))
}

async function getAnswer(dialogue = []) {
    return fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "Application/json",
        },

        body: JSON.stringify({dialogue})
    })
}

function base64ToMp3(chatId, base64){
    if (!existsSync(AUDIOS_PATH)) {
        mkdirSync(AUDIOS_PATH)
    }
    const mp3 = Buffer.from(base64, "base64")
    const filePath = `${AUDIOS_PATH}/${chatId}.mp3`;
    writeFileSync(filePath, mp3)
    return `${AUDIOS_PATH}/${chatId}.mp3`
}

async function sendMessage(message = {}) {
    const chatId = message.from.id;
    const dialogue = loadDialogue(chatId)
    dialogue.push({role: "user", content: message.text})
    const answer = await (await getAnswer(dialogue)).json()
    dialogue.push(answer.text)
    saveDialogue(chatId, dialogue)

    const mp3 = base64ToMp3(chatId, answer.audio.audioData)
    return {text: answer.text.content, audio: mp3}
}

bot.on('message', async (message) => {
    const chatId = message.from.id;
    const answer = await sendMessage(message)

    await bot.sendMessage(chatId, answer.text);
    await bot.sendVoice(chatId, answer.audio)
    console.log(answer)
});