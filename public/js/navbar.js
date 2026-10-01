const navbarButton = document.querySelector(".toggle-nav")

navbarButton.addEventListener("click", () => {
  const expanded = navbarButton.getAttribute("aria-expanded") === "true"
  navbarButton.setAttribute("aria-expanded", !expanded)
})