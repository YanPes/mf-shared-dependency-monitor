import BadgeComponent from "./badge-component.js";

/**
 *
 * @param name {string}
 * @param content
 * @returns {HTMLLIElement}
 * @constructor
 */

function DependencyAccordion(name, content) {
  // ----------------------
  // Variable Declarations
  // ----------------------

  let isInSync = false;
  let isExpanded = false;

  // ----------------------
  // Create DOM Nodes
  // ----------------------

  const dependencyAccordionDomNode = document.createElement('li');
  const headerDomNode = document.createElement('div');
  const nameDomNode = document.createElement('h3');
  const badgeDomNode = BadgeComponent(isInSync ? "In Sync" : "Out of Sync");
  const contentDomNode = document.createElement('div');

  nameDomNode.innerText = name;

  // ----------------------
  // Assemble DOM Nodes
  // ----------------------

  headerDomNode.appendChild(nameDomNode);
  headerDomNode.appendChild(badgeDomNode);
  dependencyAccordionDomNode.appendChild(headerDomNode);
  dependencyAccordionDomNode.appendChild(contentDomNode);

  // ----------------------
  // Add Classes
  // ----------------------

  dependencyAccordionDomNode.classList.add(`dependency-accordion`);
  headerDomNode.classList.add("dependency-accordion-header");
  contentDomNode.classList.add("dependency-accordion-content");

  // ----------------------
  // Logic
  // ----------------------

  contentDomNode.innerText = JSON.stringify(content);


  // ----------------------
  // State Management
  // ----------------------

  if (isInSync) {
    dependencyAccordionDomNode.classList.add("dependency-accordion-in-sync");
  } else {
    dependencyAccordionDomNode.classList.add("dependency-accordion-out-of-sync");
  }

  // ----------------------
  // Event Listeners
  // ----------------------

  dependencyAccordionDomNode.addEventListener('click', (event) => {
    event.stopPropagation();
    isExpanded = !isExpanded;

    if (isExpanded) {
      contentDomNode.style.display = 'block';
    } else {
      contentDomNode.style.display = 'none';
    }
  })

  return dependencyAccordionDomNode;
}

export default DependencyAccordion;
