// Same registry and rendering can be used on each of Tornie's three sites.
export const PROJECTS = Object.freeze([
  { id: 'fusiongus', name: 'Fusiongus', category: 'LE NOUVEAU PROJET', description: 'Le jeu de Tornie et ses téléchargements Windows et Linux.', url: 'https://tornekopanther.github.io/Fusiongus/' },
  { id: 'dunelegacy', name: 'Dune Legacy Tornie', category: 'STRATÉGIE', description: 'Retrouvez Dune Legacy Tornie, ses informations et ses versions.', url: 'https://torneko.github.io/dunelegacy-tornie/' },
  { id: 'dinotale', name: 'DinoTale Tornie', category: 'AVENTURE', description: 'Découvrez le projet Yoshi de Tornie et son guide de jeu.', url: 'https://torneko.github.io/dinotale-tornie/' }
]);

export function mountOtherProjects(container, currentProject) {
  if (!container || !PROJECTS.some(project => project.id === currentProject)) return false;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'LES JEUX DE TORNIE';
  const title = document.createElement('h2');
  title.className = 'other-heading';
  title.textContent = 'Autres projets';
  const grid = document.createElement('div');
  grid.className = 'other-grid';
  for (const project of PROJECTS.filter(item => item.id !== currentProject)) {
    const link = document.createElement('a');
    link.className = 'other-project';
    link.href = project.url;
    const category = document.createElement('span');
    category.className = 'project-category';
    category.textContent = project.category;
    const name = document.createElement('h3');
    name.textContent = project.name;
    const description = document.createElement('p');
    description.textContent = project.description;
    const cta = document.createElement('span');
    cta.textContent = 'Découvrir le projet ↗';
    link.append(category, name, description, cta);
    grid.append(link);
  }
  container.replaceChildren(eyebrow, title, grid);
  container.hidden = false;
  return true;
}
