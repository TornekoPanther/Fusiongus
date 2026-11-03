# Fusiongus

Site de présentation et de téléchargement du projet Fusiongus.

## État actuel

- Le code du site se trouve dans `website/` et sa publication est gérée par GitHub Actions.
- Le paquet public Windows contient le moteur, ses dépendances et les règles du mod. Il nécessite des données Fusiongus compatibles à importer séparément.
- Le candidat public R2 est déclaré dans `website/download-packages.json` avec `qaPassed: false` : le téléchargement reste désactivé pendant la validation.
- La version Linux viendra après validation de la version Windows.
- La navigation « Autres projets » est préparée et désactivée jusqu’à vérification des trois sites.

## Publier le site

1. Dans **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**.
2. Lancer **Actions → Publier le site Fusiongus → Run workflow** si le premier déploiement n’a pas démarré.
3. Vérifier le résultat du workflow et l’adresse qu’il retourne. L’adresse attendue est [tornekopanther.github.io/Fusiongus](https://tornekopanther.github.io/Fusiongus/).

Les modifications de `website/`, de `scripts/` et du workflow sur `main` déclenchent ensuite une publication automatique. Le site reste consultable sans paquet de jeu, avec des boutons de téléchargement désactivés.

## Paquet Windows : moteur et mod, données requises

Le téléchargement public contient le moteur, ses DLL, les sources GPL et les règles du mod. Il ne contient aucune image, aucun son, aucune vidéo, carte ou campagne, ni profil ou sauvegarde. Le ZIP seul ne permet pas de jouer.

La source de données prise en charge est une extraction privée de `Fusiongus-portable-2026-11-01-campagnes.zip`, avec `PORTABLE-MANIFEST.json` et `prototype/data`. Une installation Wargus standard ne suffit pas. Aucun importeur universel pour d’autres mods n’est fourni.

1. Extraire le ZIP public dans un dossier neuf.
2. Lancer `Configurer Fusiongus.cmd` et sélectionner le dossier `Fusiongus` de l’extraction privée compatible. L’équivalent en ligne de commande est `Fusiongus.exe --configure "X:\Mes jeux\Fusiongus"`.
3. L’import copie et vérifie environ 700 Mo de données vers le propre dossier `work-data` du paquet public, sans reprendre les profils ni sauvegardes de la source.
4. Utiliser `Verifier les donnees.cmd`, puis `Lancer Fusiongus.cmd` pour démarrer avec un profil neuf.

Pour redistribuer le paquet public, utiliser uniquement le ZIP d’origine. Le dossier configuré contient les données importées et ne doit pas être republié.

## Publier un téléchargement Windows validé

Le site ne compile pas le jeu. Le registre `website/download-packages.json` déclare chaque paquet proposé avec son type, son tag de release exact, son nom de fichier exact, sa taille et son SHA-256. Le type actuellement pris en charge est `engine-mod-requires-fusiongus-data` pour Windows x64. Un fichier simplement nommé « Windows.zip » n’active aucun bouton.

1. Vérifier le ZIP public, son empreinte et son contenu, puis tester le parcours complet dans un dossier neuf : configuration depuis la source compatible, vérification des données, lancement et partie avec profil neuf.
2. Compléter la déclaration exacte et passer `qaPassed` à `true` seulement une fois cette validation terminée. Les déclarations en attente (`false`) sont acceptées par le registre mais ne produisent aucun téléchargement.
3. Ajouter le ZIP public et ses fichiers de vérification à une release en brouillon utilisant le tag déclaré, puis publier cette release stable lorsque tous les fichiers sont présents.
4. Vérifier le workflow et le bouton Windows. Le sélecteur exige une release stable, un fichier entièrement transféré et la correspondance du nom, du tag, de la taille et de l’URL. Il compare aussi le digest GitHub au SHA-256 déclaré lorsque GitHub le fournit. Sans digest GitHub, la déclaration conserve l’empreinte vérifiée avant publication ; le navigateur ne recalcule pas l’empreinte du ZIP.

Les brouillons et préversions restent exclus. Les liens automatiques « Source code (zip) » ne sont pas des paquets Windows. Si un fichier est ajouté après la publication de la release, relancer le workflow manuellement. Ne jamais déclarer le ZIP personnel contenant les données et les sauvegardes comme téléchargement public.

## Ajouter Linux ensuite

Linux reste désactivé dans le sélecteur et dans la page. Son activation nécessitera un paquet Linux vérifié, une procédure d’installation adaptée et une extension explicite du registre, du sélecteur et des tests. Ajouter un fichier Linux à une release ne suffit pas à activer le bouton.

## Navigation commune aux trois sites

La liste des projets se trouve dans `website/other-projects.mjs`. Les sites existants vérifiés dans les métadonnées GitHub sont :

- Dune Legacy Tornie : `https://torneko.github.io/dunelegacy-tornie/`
- DinoTale Tornie (projet Yoshi) : `https://torneko.github.io/dinotale-tornie/`
- Fusiongus : `https://tornekopanther.github.io/Fusiongus/`

Une fois le parcours Windows validé et les projets prêts, vérifier les trois adresses puis passer `showOtherProjects` à `true` dans `website/config.json`. La valeur reste actuellement `false`.

Sur les deux autres sites, intégrer le même module et ses styles en l’adaptant à leur mise en page ; appeler `mountOtherProjects` avec `dunelegacy` ou `dinotale`. Le site courant est toujours exclu et seuls les deux autres sont affichés. Les deux dépôts existants n’ont pas été modifiés.

## Vérification locale

Prérequis : Node.js 22 ou ultérieur.

```text
node --test scripts/release-utils.test.mjs
node --check website/app.mjs
node --check scripts/update-downloads.mjs
```

Servir `website/` avec un serveur HTTP statique pour un aperçu. Ouvrir `index.html` avec `file://` ne permet pas le chargement des modules et des données JSON.

Le site n’utilise aucune bibliothèque externe, aucun suivi et aucune clé d’API. La publication utilise uniquement le jeton temporaire fourni automatiquement par GitHub Actions.
