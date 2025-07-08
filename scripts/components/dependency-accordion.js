import BadgeComponent from "./badge-component.js";

/**
 *
 * @param name {string}
 * @param content
 * @returns {HTMLDivElement}
 * @constructor
 */

function DependencyAccordion(name, content) {
  let isInSync = false;
  let isExpanded = false;

  const dependencyAccordionDomNode = document.createElement('li');
  const headerDomNode = document.createElement('div');
  const nameDomNode = document.createElement('h3');
  const badgeDomNode = BadgeComponent(isInSync ? "In Sync" : "Out of Sync");
  const contentDomNode = document.createElement('div');

  nameDomNode.innerText = name;

  headerDomNode.appendChild(nameDomNode);
  headerDomNode.appendChild(badgeDomNode);
  dependencyAccordionDomNode.appendChild(headerDomNode);
  dependencyAccordionDomNode.appendChild(contentDomNode);

  dependencyAccordionDomNode.classList.add(`dependency-accordion`);
  headerDomNode.classList.add("dependency-accordion-header");

  if (isInSync) {
    dependencyAccordionDomNode.classList.add("dependency-accordion-in-sync");
  } else {
    dependencyAccordionDomNode.classList.add("dependency-accordion-out-of-sync");
  }

  return dependencyAccordionDomNode;
}

export default DependencyAccordion;
