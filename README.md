# express-library

"Library" website written in in Node/Express.

---

This web application creates an online catalog for a small local library, where users can browse available books and manage their accounts.
Also implemented User Authentication and Authorization.

![A UML diagram showing the relation of database entities in this example repository](https://raw.githubusercontent.com/mdn/express-locallibrary-tutorial/main/public/images/Library%20Website%20-%20Mongoose_Express.png)

> **Note** This project based on this [MDN tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website)..

## Quick Start

To get this project up and running locally on your computer:

1. Set up a [Node.js](https://wiki.developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/development_environment) development environment.
2. Once you have node setup install the project in the root of your clone of this repo:

   ```bash
   npm install
   ```
3. Run the tutorial server, using the appropriate command line shell for your environment:

   ```bash
   # Linux terminal
   DEBUG=express-locallibrary-tutorial:* npm run devstart
   
   # Windows Powershell
   $ENV:DEBUG = "express-locallibrary-tutorial:*"; npm start
   ```
4. Open a browser to <http://localhost:3000/> to open the library site.

> **Note:** The library uses a default MongoDB database hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). You should use a different database for your own code experiments.
