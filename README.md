# Fusiongus

Site de présentation et de téléchargement du projet Fusiongus.

## État actuel

- Le code du site se trouve dans `website/` et sa publication est gérée par GitHub Actions.
- Le paquet Windows prêt à lancer doit encore être ajouté aux Releases après vérification.
- La version Linux viendra après validation de la version Windows.
- La navigation « Autres projets » est préparée et désactivée jusqu’à vérification des trois sites.

## Publier le site

1. Dans **Settings → Pages → Build and deployment → Source**, choisir **GitHub Actions**.
2. Lancer **Actions → Publier le site Fusiongus → Run workflow** si le premier déploiement n’a pas démarré.
3. Vérifier le résultat du workflow et l’adresse qu’il retourne. L’adresse attendue est [tornekopanther.github.io/Fusiongus](https://tornekopanther.github.io/Fusiongus/).

Les modifications de `website/`, de `scripts/` et du workflow sur `main` déclenchent ensuite une publication automatique. Le site reste consultable sans paquet de jeu, avec des boutons de téléchargement désactivés.

## Ajouter le jeu Windows

Le site ne compile pas le jeu : il distribue les paquets prêts à lancer joints aux Releases.

1. Sur le PC qui contient le jeu, préparer un ZIP complet : exécutable, dépendances, données nécessaires et instructions de lancement.
2. Tester ce ZIP après extraction dans un dossier neuf.
3. Publier une Release stable dans `TornekoPanther/Fusiongus` et joindre un paquet nommé par exemple `Fusiongus-Windows-x64-v0.1.0.zip`.
4. Attendre le redéploiement du site. Le bouton Windows devient actif uniquement si un vrai paquet est joint à une Release stable.

Ne pas utiliser les liens automatiques « Source code (zip) » comme téléchargement du jeu.
Si un fichier est ajouté après la publication de la Release, relancer le workflow manuellement.

## Ajouter Linux ensuite

Après compilation et vérification du jeu sous Linux, joindre par exemple `Fusiongus-Linux-x64-v0.1.0.AppImage` ou `Fusiongus-Linux-x64-v0.1.0.tar.gz` à une Release stable. Le bouton Linux se met à jour au prochain déploiement.

Les formats `.deb` et `.rpm` sont également reconnus. Une archive non identifiée comme Windows ou Linux n’est pas proposée automatiquement.

## Navigation commune aux trois sites

La liste des projets se trouve dans `website/other-projects.mjs`. Les sites existants vérifiés dans les métadonnées GitHub sont :

- Dune Legacy Tornie : `https://torneko.github.io/dunelegacy-tornie/`
- DinoTale Tornie (projet Yoshi) : `https://torneko.github.io/dinotale-tornie/`
- Fusiongus : `https://tornekopanther.github.io/Fusiongus/`

Une fois Fusiongus publié et fonctionnel, vérifier les trois adresses puis passer `showOtherProjects` à `true` dans `website/config.json`.

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
