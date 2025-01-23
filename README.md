# SteamFrog

Steamfrog is a Steam Store collector.<br>
It collects info, reviews and achievements on all games and dlcs existing on the steam store.

Be warned, this is my first ever open-source project

It's a work in progress, but I did collected the whole store with it.

## Foreword

I needed to train on some stuff, but it's too boring to do it with dummy data -> SteamFrog is borned.

It was weirdly difficult and tedious to find how to effectively get all the games and dlcs available on Steam.<br>
Since it looked like it interested people online, I decided to make it public so anybody can find a little more info.<br>
Of course, it's undocumented ;)

**Important**<br>
It's all about playing with some Steam apps data, not about profesionnally use Steam API for your game or else.<br>
You should use my code nothing more than for personnal projects... and fun of course.

If you want to get in touch to talk about it or need help playing with the Steam Web API : https://discord.gg/7X4dbf4jY3

## Stack

You **will** often find unused endpoints/services/code in my project.<br>
I always start from the same base I custom and maintain. Doing so, I don't cut what I know I will use in the following months

**Important**<br>
If the *.env* is not as filled as the *.env.example*, it will break even if it's unnecessary (S3, Brevo, Discord Webhook...)<br>
Put dummy values, it should just yell at you once at launch then proceed to work properly.<br>
I couldn't be bothered to make it optional but it'll happen at some points in my life.

### Development

***Framework***<br>
Developped with [Adonisjs](https://adonisjs.com/ "Adonisjs official website") framwork<br>
*AdonisJS is a TypeScript-first web framework for building web apps and API servers* (from their website)<br>
In this project, I use it only as an API server

If you ever dreamt of a laravel-like opinionated framework but in typescript, you should have a look.

***Main dependencies***<br>
I added the following :
- [Bree](https://www.npmjs.com/package/bree "Bree on npmjs"), for workers
- [Brevo](https://www.npmjs.com/package/@getbrevo/brevo "Brevo on npmjs"), for email sending

***Other dependencies***
- Steam Web API endpoints, obviously (read /app/services/steam_data*)
- Discord Webhook to debug and collect progress (read /app/utils/discord_message.ts)

***Database***
I use PostgreSQL with [Lucid ORM](https://lucid.adonisjs.com/docs/introduction "Lucid ORM Documentation") that comes with [Adonisjs](https://adonisjs.com/)

### Deployment
The project is pre-configured to be deployed on [Clever Cloud](https://www.clever-cloud.com/ "Clever Cloud official website")<br>
You can have a read at the [documentation](https://www.clever-cloud.com/developers/doc/applications/javascript/nodejs/ "Clever Cloud Node App documentation") to setup the environment properly.

I use it to host PostgreSQL too, the dev tier is free and enough to collect the entire Steam Store **for what I decided to store**.<br>
Here is the [documentation])(https://www.clever-cloud.com/developers/doc/addons/postgresql/ "Clever Cloud PostgreSQL documentation")... but it's pretty plug and play.
