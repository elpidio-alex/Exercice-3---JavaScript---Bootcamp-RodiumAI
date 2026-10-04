/*
Date : 01/10/2026
Auteurs : Elpidio Alexis AMOUSSOU
Email : amoussouelpidioalexis@gmail.com
But : Script en python pour l'exercice 3 du Bootcamp RodiumAI.
    - Étape 1 : Chat avec un modèle de langage
    - Étape 2 : Génération d'image
    - Étape 3 : Génération de vidéo
*/

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { RodiumAI, RodiumAIError } from 'rodiumai';

const CHAT_MODEL = 'anthropic/claude-sonnet-4-6';
const IMAGE_MODEL = 'google/gemini-3.1-flash-image';
const VIDEO_MODEL = 'google/veo-3.1-lite';

const rl = readline.createInterface({ input, output });

// Le SDK lit RODIUMAI_API_KEY dans l'environnement (chargé depuis .env par dotenv).
let client;
try {
  client = new RodiumAI();
} catch (err) {
  console.error(`Impossible de créer le client : ${err.message}`);
  console.error('Vérifie que le fichier .env contient RODIUMAI_API_KEY.');
  process.exit(1);
}

function showError(err) {
  if (err instanceof RodiumAIError) {
    console.error(`Erreur HTTP ${err.code} (error_code : ${err.errorCode}) : ${err.message}`);
    if (err.requestId) console.error(`request_id : ${err.requestId}`);
    if (err.fixSuggestion) console.error(`Suggestion : ${err.fixSuggestion}`);
  } else {
    console.error(`Erreur : ${err.message}`);
  }
}

async function stepChat() {
  const question = (await rl.question('Votre question : ')).trim();
  if (!question) {
    console.log('Question vide, étape ignorée.');
    return;
  }
  try {
    const rep = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: question }],
      timeout: 60000,
    });
    console.log(`\n${rep.choices[0].message.content}\n`);
    if (rep.usage) {
      console.log(
        `Tokens : ${rep.usage.prompt_tokens} en entrée, ${rep.usage.completion_tokens} en sortie`
      );
    }
    // Le SDK ne renvoie pas cost_rodi : le coût se lit dans les logs d'usage du dashboard.
    console.log('Coût : non fourni par le SDK (voir les logs d\'usage du dashboard)');
  } catch (err) {
    showError(err);
  }
}

async function stepImage() {
  const prompt = (await rl.question('Décrivez l\'image : ')).trim();
  if (!prompt) {
    console.log('Description vide, étape ignorée.');
    return;
  }
  try {
    const rep = await client.images.generate({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'low',
      timeout: 120000,
    });
    const item = rep.data[0];
    if (item?.b64_json) {
      writeFileSync('image.png', Buffer.from(item.b64_json, 'base64'));
      console.log('Image enregistrée : image.png');
    } else if (item?.url) {
      console.log(`Le serveur a renvoyé une URL au lieu de base64 : ${item.url}`);
    } else {
      console.log('Réponse reçue, mais sans image exploitable.');
    }
    console.log('Coût : non fourni par le SDK (voir les logs d\'usage du dashboard)');
  } catch (err) {
    showError(err);
  }
}

async function stepVideo() {
  const prompt = (await rl.question('Décrivez la vidéo : ')).trim();
  if (!prompt) {
    console.log('Description vide, étape ignorée.');
    return;
  }
  try {
    const rep = await client.video.generations.create({
      model: VIDEO_MODEL,
      prompt,
      duration_seconds: 4,
      aspect_ratio: '9:16',
      timeout: 150000,
    });
    const item = rep?.data?.[0];
    if (item?.b64_json) {
      writeFileSync('video.mp4', Buffer.from(item.b64_json, 'base64'));
      console.log('Vidéo enregistrée : video.mp4');
    } else if (item?.url) {
      console.log(`Vidéo disponible à l'adresse : ${item.url}`);
    } else {
      console.log('Réponse reçue, mais sans vidéo exploitable.');
    }
  } catch (err) {
    showError(err);
  }
}

const steps = [
  { name: 'Chat', run: stepChat },
  { name: 'Image', run: stepImage },
  { name: 'Vidéo', run: stepVideo },
];

async function askChoice(index) {
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const options = [];
  const allowed = [];
  if (!isFirst) {
    options.push('revenir en arrière (b)');
    allowed.push('b');
  }
  options.push('rester (r)');
  allowed.push('r');
  if (isLast) {
    options.push('quitter (q)');
    allowed.push('q');
  } else {
    options.push('passer à la suivante (s)');
    allowed.push('s');
  }
  while (true) {
    const answer = (await rl.question(`\n${options.join(', ')} ? `)).trim().toLowerCase();
    if (allowed.includes(answer)) return answer;
    console.log(`Choix invalide. Options : ${allowed.join(', ')}`);
  }
}

async function main() {
  let i = 0;
  while (i >= 0 && i < steps.length) {
    console.log(`\n=== Étape ${i + 1} : ${steps[i].name} ===`);
    await steps[i].run();
    const choice = await askChoice(i);
    if (choice === 'b') i -= 1;
    else if (choice === 's') i += 1;
    else if (choice === 'q') break;
    // 'r' : on reste sur la même étape
  }
  rl.close();
  console.log('Au revoir.');
}

main();