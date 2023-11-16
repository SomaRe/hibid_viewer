// Constants for DOM elements
const toggleButton = document.querySelector("#toggle-button");
const filterSelected = document.querySelector("#filter-selected");
const pageNumberElement = document.querySelector("#pageNumber");
const totalPagesElement = document.querySelector("#totalPages");
const categoriesContainerMain = document.querySelector("#categories-container-main");
const container = document.querySelector("#container");
const spinner = document.querySelector("#spinner");

// Page and filter variables
let pageNumber = 1;
let selectedCategory = null;

// TODO: For future use or retired
let chunkSize = 100;
// let categoryFilters = [];


// function to create cards
function createCards(data) {
  let allCardsHTML = data.map(item => {
    // Create class list for item categories
    let categoryClasses = item["category"]
      .split(" - ")
      .map(x => x.replaceAll(" ", "_"))
      .join(" ");

    // Card HTML template
    return `
      <div class="card my-2 ${categoryClasses}" data-href="https://www.hibid.com/lot/${item["lotId"]}">
        <div class="card-title-container p-2">
          <h5 class="card-title">${item["lead"]}</h5>
        </div>  
        <img src="${item["thumbnailLocation"]}" class="card-img-top">
        <div class="card-body">
          <p class="card-text text">Date: ${item["eventDateEnd"]}</p>
          <div class="d-flex justify-content-between">
            <p class="card-text fs-6 text">High Bid: ${item["highBid"]}</p>
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = allCardsHTML;
}

// Function to create a collapsible category tree
function createCollapsible(category, parentId) {
  return Object.entries(category).map(([key, subcategory], idx) => {
    const id = `${parentId}-${idx}`;
    const hasSubcategories = Object.keys(subcategory).length > 0;

    return `
      <div class="cat-tree-row">
        <input type="radio" id="rad-${id}" name="categoryRadio" value="${key}">
        <label for="rad-${id}">${key}</label>
        ${hasSubcategories ? `
          <button class="btn btn-outline-primary btn-sm ml-2 cat-plus-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
            +
          </button>
          <div class="collapse" id="${id}">
            <div class="cat-tree-section">
              ${createCollapsible(subcategory, id)}
            </div>
          </div>
        ` : ''}
      </div>`;
  }).join('');
}

// Event listeners for UI elements
function setUpEventListeners() {
  window.addEventListener("resize", handleResize);
  toggleButton.addEventListener("click", toggleCategories);
  container.addEventListener("click", handleCardClick);
  document.querySelector("#save-filter").addEventListener("click", saveFilter);
  document.querySelector("#clear-filter").addEventListener("click", clearFilter);
  document.querySelector("#close-categories").addEventListener("click", closeCategories);
  pageNumberElement.addEventListener("change", handlePageChange);
}

// Function to handle screen resize event
function handleResize() {
  categoriesContainerMain.style.display = window.innerWidth < 992 ? "none" : "block";
}

// Function to save the selected filter
function saveFilter() {
  selectedCategory = document.querySelector('input[name="categoryRadio"]:checked')?.value;
  // if screen is small, close the categories
  if (window.innerWidth < 992){
    categoriesContainerMain.style.display = "none";
  }
  filterSelected.style.display = "block";
  filterSelected.innerText = selectedCategory;
  fetchDataAndUpdateUI(false);
}

// Function to clear the selected filter
function clearFilter() {
  // Retrieve the selected radio button
  const selectedRadio = document.querySelector('input[name="categoryRadio"]:checked');
  // toggleButton.querySelector("#filter-badge").innerHTML = '<i class="bi bi-funnel"></i>';

  // If a radio button is selected, clear it
  if (selectedRadio) {
    selectedRadio.checked = false;
  }

  if (window.innerWidth < 992){
    categoriesContainerMain.style.display = "none";
  }
  selectedCategory = null;
  filterSelected.innerText = "none";
}

// Function to fetch and load categoty tree
function fetchAndLoadCategoryTree() {
  fetch("/getCategories")
  .then(response => response.json())
  .then(data => {
    const categoryTree = createCollapsible(data, "root");
    document.querySelector("#categories-container").innerHTML = categoryTree;
  });
}

// Function to toggle the categories panel
function toggleCategories() {
  categoriesContainerMain.style.display = "block";
}

// Function to close the categories panel
function closeCategories() {
  categoriesContainerMain.style.display = "none";
}

// Function to handle card click event
function handleCardClick(event) {
  let target = event.target;

  // Check if the clicked element or its parent has a dataset.href attribute
  while (target !== this && !target.dataset.href) {
    target = target.parentElement;
  }

  // If dataset.href exists, open the link
  if (target.dataset.href) {
    window.open(target.dataset.href, "_blank");
  }
}

// Function to handle search functionality
function performSearch(event) {
  event.preventDefault();
  document.getElementById("searchButton").disabled = true; 
  pageNumber = 1;
  pageNumberElement.value = pageNumber;
  fetchDataAndUpdateUI(false);
}

// Function to handle page number change
function handlePageChange() {
  pageNumber = parseInt(pageNumberElement.value);
  container.innerHTML = "";
  fetchDataAndUpdateUI(false);
}

// Function to fetch data and update UI
function fetchDataAndUpdateUI(isInitialLoad = true) {
  spinner.classList.remove('hide-spinner');
  const searchQuery = isInitialLoad ? "" : document.querySelector("#searchQuery").value;
  const category = selectedCategory;

  let requestData = {
    chunkSize: chunkSize,
    pageNumber: pageNumber,
    searchQuery: searchQuery,
    category: category
  };

  fetch("/fetchData", {
    method: "POST",
    body: JSON.stringify(requestData),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
  .then((response) => response.json())
  .then((data) => {
    spinner.classList.add('hide-spinner');
    createCards(data["res"]); // Update UI with the data
    totalPagesElement.innerText = Math.ceil(data["total_results"] / chunkSize);
    if (!isInitialLoad) {
      document.getElementById("searchButton").disabled = false;
    }
  })
  .catch(error => {
    console.error('Fetch failed:', error);
    document.getElementById("searchButton").disabled = false;
  });
}

// Initialize the script
function init() {
  setUpEventListeners();
  fetchDataAndUpdateUI();
  fetchAndLoadCategoryTree();
}

// Start the script
init();
