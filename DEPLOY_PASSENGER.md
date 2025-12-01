# Déploiement sur o2switch / Phusion Passenger

Ce document décrit des étapes et des recommandations pour déployer ce projet Node/Express sur un hébergement mutualisé o2switch utilisant Phusion Passenger (cPanel). Il couvre les problèmes courants : `public` hors de la racine, `node_modules`/Prisma, et configuration du démarrage.

## Résumé des modifications apportées
- Le serveur détecte automatiquement `root/public` et `root/uploads` s'ils existent ; sinon il utilise `src/public` et `src/uploads`.
- Le fichier `src/index.js` exporte maintenant l'app Express (`module.exports = app`) et ne démarre le serveur que s'il est exécuté directement. Le fichier `index.js` à la racine démarre le serveur quand vous exécutez `node index.js`.

## Étapes de déploiement recommandées

1. Placer le projet dans un répertoire sur votre hébergement (par exemple `/home/username/myheadless`).
2. Installer les dépendances (dans cPanel Terminal ou via SSH) :

```bash
cd ~/myheadless
npm ci --production
```

3. Générer le client Prisma (si vous utilisez Prisma) :

```bash
npx prisma generate
```

Si vous ne pouvez pas exécuter `npx` sur l'environnement de prod, générez le client localement et incluez le dossier `node_modules/@prisma/client` dans l'archive que vous déployez.

4. Variables d'environnement

Assurez-vous de définir `DATABASE_URL` et toute autre variable nécessaire via l'interface cPanel ou un fichier `.env` non versionné.

5. Emplacement des fichiers statiques

- Si votre hébergeur vous fournit un dossier `public_html` (ex : cPanel), vous avez deux options :
  - Déplacer le contenu `public` (index.html, styles, scripts) dans `public_html` et créer un `public` symlink si besoin :

```bash
cd ~/myheadless
ln -s public_html public
```

  - Ou créer `public` à la racine du projet et y copier le contenu de `src/public` (l'app détectera automatiquement `root/public` si présent).

6. Démarrage (Phusion Passenger)

En cPanel, créez une application Node.js pointant vers le répertoire du projet et le script d'entrée `index.js` (ou `app.js` si vous préférez). Passenger utilisera `npm start` ou `node index.js` selon votre configuration.

7. Vérifications en cas d'erreurs courantes

- Erreur "Cannot find module 'express'" → `node_modules` absent sur la machine / pas d'installation des dépendances.
- Erreur "Cannot find module '@prisma/client'" → assurez-vous d'avoir exécuté `prisma generate` et d'avoir bien installé `@prisma/client`.
- Fichiers statiques 404 (css/js/images) → vérifier si vos fichiers sont dans `public` à la racine ou `public_html` et que le serveur web sert bien ce dossier. Si cPanel utilise `public_html`, créez un symlink `public` pointant vers `public_html`.

## Recommandations supplémentaires
- Générer le client Prisma pendant le processus CI/CD et déployer les artefacts compilés.
- Ajouter un script de santé/status dans cPanel qui vérifie `/status`.
- S'assurer de la bonne version de Node : si o2switch propose un sélecteur de versions, utilisez >= 18.

--
Si vous voulez, je peux aussi :
- ajouter un script `bin/start-passenger` prêt pour cPanel/Passenger ;
- modifier le code pour détecter automatiquement `public_html` en plus de `public`.
