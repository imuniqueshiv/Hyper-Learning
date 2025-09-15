// Reusable function to inject HTML
function loadHTML(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.text();
    })
    .then(data => {
      document.getElementById(id).innerHTML = data;
    })
    .catch(err => console.error(err));
}

// Always load from root directory
loadHTML("header", "header.html");
loadHTML("footer", "footer.html");
