# Exercice 3 - JavaScript : script interactif avec le SDK `rodiumai`

> Module 03 · Utiliser les API IA avec RodiumAi · Bootcamp RodiumAi

Script Node.js en ligne de commande qui enchaîne trois actions (**chat**, **génération d'image**, **génération de vidéo**) à l'aide du SDK npm [`rodiumai`](https://www.npmjs.com/package/rodiumai). À la fin de chaque étape, l'utilisateur choisit de revenir en arrière, de rester ou de passer à la suite.

**Auteur :** Elpidio Alexis AMOUSSOU, Licence Professionnelle Cybersécurité, iPNet Institute of Technology (Lomé, Togo)

---

## Sommaire

1. [Aperçu](#aperçu)
2. [Fonctionnalités](#fonctionnalités)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)
7. [Navigation entre les étapes](#navigation-entre-les-étapes)
8. [Modèles et paramètres utilisés](#modèles-et-paramètres-utilisés)
9. [Gestion des erreurs](#gestion-des-erreurs)
10. [Limites connues du SDK](#limites-connues-du-sdk)
11. [Structure du dépôt](#structure-du-dépôt)
12. [Sécurité](#sécurité)
13. [Dépannage](#dépannage)
14. [Coûts](#coûts)
15. [Auteur](#auteur)

---

## Aperçu

Ce projet est la version JavaScript de l'exercice 3 : refaire le script interactif de l'exercice 2 (écrit en Python avec `requests`, sans SDK), cette fois avec un SDK. Les trois étapes sont exécutées dans l'ordre :

| Étape | Action | Méthode du SDK | Résultat |
|---|---|---|---|
| 1 | Chat | `client.chat.completions.create()` | Texte de la réponse et tokens consommés |
| 2 | Image | `client.images.generate()` | Fichier `image.png` |
| 3 | Vidéo | `client.video.generations.create()` | Fichier `video.mp4` (voir [Limites connues](#limites-connues-du-sdk)) |

## Fonctionnalités

- Boucle interactive avec choix entre **revenir en arrière (b)**, **rester (r)**, **passer à la suivante (s)** ou **quitter (q)**.
- L'option « revenir en arrière » n'est pas proposée à l'étape 1, et « suivante » n'est pas proposée à l'étape 3 (le script propose alors de quitter).
- Saisies vides ignorées, choix invalides redemandés.
- Clé API lue depuis le fichier `.env`, jamais écrite dans le code.
- Gestion des erreurs du SDK avec affichage du code HTTP, de l'`error_code`, du `request_id` et de la suggestion de correction.
- Timeouts adaptés à chaque type d'appel.

## Prérequis

| Élément | Version |
|---|---|
| Node.js | 18 ou plus (version utilisée : [à compléter, par exemple 20.x]) |
| npm | fourni avec Node.js |
| Compte RodiumAi | avec des crédits RODI et une clé API (`rd_sk_...`) |

Pour vérifier ta version : `node --version`.

## Installation

```bash
git clone https://github.com/elpidio-alex/Exercice-3---JavaScript---Bootcamp-RodiumAI
cd [nom-du-dossier]
npm install
```

Dépendances installées :

| Paquet | Rôle |
|---|---|
| `rodiumai` (`^0.2.0`) | SDK officiel RodiumAi |
| `dotenv` (`^16.4.5`) | Chargement du fichier `.env` |

Le projet utilise les modules ES (`"type": "module"` dans `package.json`).

## Configuration

1. Copie le fichier d'exemple :

```bash
   # macOS / Linux / Git Bash
   cp .env.example .env
```

```powershell
   # PowerShell
   Copy-Item .env.example .env
```

2. Ouvre `.env` et remplace la valeur par ta clé :

```
   RODIUMAI_API_KEY=rd_sk_votre_cle
```

Tu peux créer ta clé sur [rodiumai.io/dashboard](https://rodiumai.io/dashboard) (menu « Clés API »). Elle n'est affichée qu'une seule fois : copie-la tout de suite.

## Utilisation

```bash
npm start
```

Exemple de déroulement :

```
=== Étape 1 : Chat ===
Votre question : Explique en trois phrases ce qu'est une API REST.
[réponse du modèle]
Tokens : 26 en entrée, 111 en sortie
Coût : non fourni par le SDK (voir les logs d'usage du dashboard)

rester (r), passer à la suivante (s) ? s

=== Étape 2 : Image ===
Décrivez l'image : Flyer pour un concert de musique à Lomé, style affiche colorée
Image enregistrée : image.png

revenir en arrière (b), rester (r), passer à la suivante (s) ? s

=== Étape 3 : Vidéo ===
Décrivez la vidéo : Vagues sur une plage au coucher du soleil, plan cinématique
...
```

## Navigation entre les étapes

| Touche | Action | Disponible |
|---|---|---|
| `b` | Revenir à l'étape précédente | Étapes 2 et 3 |
| `r` | Refaire l'étape en cours | Toutes les étapes |
| `s` | Passer à l'étape suivante | Étapes 1 et 2 |
| `q` | Quitter le programme | Étape 3 |

## Modèles et paramètres utilisés

| Étape | Modèle | Paramètres principaux | Timeout |
|---|---|---|---|
| Chat | `openai/gpt-4o` | `messages` avec un seul message utilisateur | 60 s |
| Image | `openai/gpt-image-1` | `n: 1`, `size: 1024x1024`, `quality: low` | 120 s |
| Vidéo | `google/veo-3.1-generate-preview` | `duration_seconds: 4`, `aspect_ratio: 9:16` | 150 s |

La durée de la vidéo est volontairement courte : la génération est facturée à la seconde générée. Les identifiants de modèles peuvent être consultés via `GET /v1/models` ou sur [rodiumai.io/models](https://rodiumai.io/models).

## Gestion des erreurs

Toutes les erreurs levées par le SDK sont attrapées par étape, ce qui évite que le script s'arrête brutalement. Pour une erreur de type `RodiumAIError`, le script affiche :

```
Erreur HTTP <code> (error_code : <code_erreur>) : <message>
request_id : <identifiant>
Suggestion : <correction proposée par le SDK>
```

Codes HTTP les plus courants :

| HTTP | Signification probable | Que faire |
|---|---|---|
| 401 | Clé absente ou fausse | Vérifier `.env` |
| 402 | Solde RODI épuisé | Recharger en Mobile Money |
| 403 | Droits insuffisants pour la clé | Vérifier les droits de la clé |
| 404 | Modèle inexistant | Consulter `GET /v1/models` |
| 429 | Trop de requêtes | Attendre, puis réessayer |
| 5xx | Incident côté serveur | Réessayer plus tard |

Le SDK réessaie automatiquement les erreurs temporaires (429 et 5xx).

## Limites connues du SDK

Observations faites avec `rodiumai` **version 0.2.0** (dernière version publiée sur npm au 04/10/2026).

1. **Génération vidéo indisponible.** `client.video.generations.create()` lève une erreur avant d'envoyer la moindre requête :

```
   Video generation is not yet available. We are working on it and it will be released soon.
```

   Dans le code du paquet, cette méthode est un simple `throw`. L'étape 3 du script appelle bien la méthode du SDK : l'erreur affichée est donc celle du SDK, et non un bug du script. Le problème a été signalé à l'équipe pédagogique, qui a annoncé une mise à jour. Une fois la nouvelle version publiée : `npm install rodiumai@latest`.

2. **`cost_rodi` n'est pas renvoyé.** Le SDK ne conserve que les champs `id`, `model`, `choices` et `usage` (tokens). Le script affiche donc les tokens, et le coût exact se lit dans les logs d'usage du dashboard.

3. **Import nommé uniquement.** Le README du paquet montre `import RodiumAI from 'rodiumai'`, mais le paquet n'a qu'un export nommé. Il faut écrire :

```javascript
   import { RodiumAI } from 'rodiumai';
```

## Structure du dépôt

```
.
├── README.md          # Ce document
├── .env.example       # Modèle de configuration (sans clé réelle)
├── .gitignore         # Exclut .env, node_modules, image.png, video.mp4
├── package.json       # Dépendances et scripts
├── package-lock.json  # Versions exactes des dépendances
└── main.js            # Script interactif (chat, image, vidéo)
```

Fichiers générés à l'exécution (non versionnés) : `image.png`, `video.mp4`.

## Sécurité

- La clé API est lue depuis `.env`, qui figure dans `.gitignore` : elle ne doit **jamais** apparaître dans le code, un commit ou une capture d'écran.
- Seul `.env.example` est versionné, avec une valeur factice.
- En cas de fuite : révoquer la clé dans le dashboard, puis en créer une nouvelle.
- La clé ne doit jamais être utilisée côté navigateur : ce script s'exécute côté serveur, dans Node.js.

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Cannot find package 'rodiumai'` | Dépendances non installées | Lancer `npm install` |
| `does not provide an export named default` | Mauvais import | Utiliser `import { RodiumAI } from 'rodiumai'` |
| `Impossible de créer le client` | `RODIUMAI_API_KEY` absente | Vérifier que `.env` existe et contient la clé |
| Erreur 401 | Clé fausse ou révoquée | Recréer une clé dans le dashboard |
| Erreur 402 | Solde insuffisant | Recharger en RODI |
| `SyntaxError: Cannot use import statement` | Module non déclaré en ES | Vérifier `"type": "module"` dans `package.json` |
| Erreur de version Node | Node inférieur à 18 | Mettre Node.js à jour |
| Timeout sur l'image ou la vidéo | Génération longue | Réessayer avec une description plus simple |

## Coûts

Chaque appel consomme des crédits RODI. Pour limiter les dépenses pendant les tests, le script utilise `quality: low` pour l'image et une vidéo de 4 secondes. Le détail de chaque appel (tokens et RODI débités) est consultable dans les **journaux d'usage** du dashboard RodiumAi.

## Auteur

**Elpidio Alexis AMOUSSOU**
Licence Professionnelle Cybersécurité · iPNet Institute of Technology, Lomé, Togo
GitHub : [github.com/elpidio-alex](https://github.com/elpidio-alex)

Dépôt : (https://github.com/elpidio-alex/Exercice-3---JavaScript---Bootcamp-RodiumAI)