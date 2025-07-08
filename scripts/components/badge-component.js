/**
 *
 * @param type {"In Sync" | "Out of Sync"}
 * @constructor
 */

function BadgeComponent(type) {
  const badge = document.createElement('span');

  badge.innerText = type;

  badge.classList.add('badge');

  if(type === "In Sync") {
    badge.classList.add('badge-sync');
  }

  if(type === "Out of Sync") {
    badge.classList.add('badge-out-of-sync');
  }

  return badge;
}

export default BadgeComponent
