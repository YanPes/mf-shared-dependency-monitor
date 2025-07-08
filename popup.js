function getListOfSharedDependencies() {
  if (!window.__FEDERATION__) {
    console.error("Module Federation is not initialized.");
    return {};
  }
  return Object.entries(window.__FEDERATION__.__SHARE__).map(dependency => {
    console.log("dependency : ", dependency)
  });
}

const listOfSharedDependencies = getListOfSharedDependencies();

console.info("listOfSharedDependencies: ", listOfSharedDependencies)
