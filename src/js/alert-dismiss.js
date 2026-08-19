/* Barefoot — opt-in: dismissible alerts.
   Removes the closest [data-alert] when its [data-alert-dismiss]
   button is clicked. Zero dependencies, <1KB.

   <div data-alert="danger" role="alert">
     <p>Deploy failed.</p>
     <button data-alert-dismiss aria-label="Dismiss">×</button>
   </div>

   import "barefoot/js/alert-dismiss.js"
*/

export function initAlertDismiss(root = document) {
  root.addEventListener("click", (e) => {
    const button = e.target.closest?.("[data-alert-dismiss]");
    if (!button) return;
    button.closest("[data-alert]")?.remove();
  });
}

function autoInit() {
  const whenReady = () => initAlertDismiss();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", whenReady);
  } else {
    whenReady();
  }
}

export default autoInit;
autoInit();