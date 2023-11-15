CHUNK_SIZE = 100;
pageNumber = 1;
let selectedCategory = null;
let categoryFilters = [];

let toggleButton = document.querySelector("#toggle-button");
let filterSelected = document.querySelector("#filter-selected");
pageNumberElement = document.querySelector("#pageNumber");

// function to create cards
function createCards(data) {
  for (item of data) {
    try {
      // Extract category classes
      let categoryClasses = item["category"]
        .split(" - ")
        .map((x) => x.replaceAll(" ", "_"))
        .join(" ");


      // Use template literals to format the card as a string
      let cardHTML = `
              <div class="card m-2 ${categoryClasses}" data-href="https://www.hibid.com/lot/${item["lotId"]}">
              <div class="card-title-container p-2">
                <h5 class="card-title">${item["lead"]}</h5>
              </div>  
              <img src="${item["thumbnailLocation"]}" class="card-img-top">
                  <div class="card-body">
                      <p class="card-text text">Date: ${item["eventDateEnd"]}</p>
                      <div class="d-flex justify-content-between">
                        <p class="card-text fs-6 text">High Bid: ${item["highBid"]}</p>
                      <div>
                    </div>
              </div>
          `;

      // Append the card to the container
      document.querySelector("#container").innerHTML += cardHTML;
    } catch (err) {
      console.log(err);
    }
  }
}

// function to create category tree
function createCollapsible(category, parentId) {
  let output = "";
  let idx = 0;

  for (let key in category) {
    let id = `${parentId}-${idx}`;
    let hasSubcategories = Object.keys(category[key]).length > 0;

    output += `
<div class="cat-tree-row">
<input type="radio" id="rad-${id}" name="categoryRadio" value="${key}">
<label for="rad-${id}">${key}</label>`;

    if (hasSubcategories) {
      output += `
<button class="btn btn-outline-primary btn-sm ml-2 cat-plus-btn" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
  +
</button>
<div class="collapse" id="${id}">
<div class="cat-tree-section">
  ${createCollapsible(category[key], id)}
</div>
</div>`;
    }

    output += `</div>`;

    idx++;
  }

  return output;
}

// listen for change in screen size and open/close categories accordingly
window.addEventListener("resize", () => {
  if (window.innerWidth < 768){
    document.querySelector("#categories-container-main").style.display = "none";
  }
  else{
    document.querySelector("#categories-container-main").style.display = "block";
  }
})

// Modify the filter button event listener to save the selected category
document.querySelector("#save-filter").addEventListener("click", () => {
  selectedCategory = document.querySelector('input[name="categoryRadio"]:checked')?.value;
  // toggleButton.querySelector("#filter-badge").innerHTML = '<i class="bi bi-funnel-fill"></i>';
  // if screen is small, close the categories
  if (window.innerWidth < 768){
  document.querySelector("#categories-container-main").style.display = "none";
  }
  filterSelected.style.display = "block";
  filterSelected.innerText = selectedCategory;
})

// Implement clear button functionality
document.querySelector("#clear-filter").addEventListener("click", () => {
  // Retrieve the selected radio button
  const selectedRadio = document.querySelector('input[name="categoryRadio"]:checked');
  // toggleButton.querySelector("#filter-badge").innerHTML = '<i class="bi bi-funnel"></i>';

  // If a radio button is selected, clear it
  if (selectedRadio) {
    selectedRadio.checked = false;
  }

  // Reset the selectedCategory variable
  selectedCategory = null;

  // Reset the filterSelected text
  filterSelected.style.display = "none";
  filterSelected.innerText = "None";
});


document.querySelector("#toggle-button").addEventListener("click", () => {
  document.querySelector("#categories-container-main").style.display = "block";
});

// FIXME: closing categories makes it so that even in desktop mode, the categories are not visible

document.querySelector("#close-categories").addEventListener("click", () => {
  document.querySelector("#categories-container-main").style.display = "none";
});

// Update the search functionality
document.getElementById("search").addEventListener("click", function (event) {
  event.preventDefault();
  const searchQuery = document.getElementById("searchQuery").value;
  document.getElementById('spinner').classList.remove('hide-spinner');
  document.querySelector("#container").innerHTML = "";

  let requestData = {
    searchQuery: searchQuery,
    category: selectedCategory
  };

  fetch("/searchAndFilter", {
    method: "POST",
    body: JSON.stringify(requestData),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
  .then((response) => response.json())
  .then((data) => {
    document.getElementById('spinner').classList.add('hide-spinner');
    document.querySelector("#container").innerHTML = "";
    createCards(data["res"]);
  });
});

document
  .querySelector("#container")
  .addEventListener("click", function (event) {
    let target = event.target;

    // Check if the clicked element or its parent has a dataset.href attribute
    while (target !== this && !target.dataset.href) {
      target = target.parentElement;
    }

    // If dataset.href exists, open the link
    if (target.dataset.href) {
      window.open(target.dataset.href, "_blank");
    }
  });


// as page number is changed, change the cards
pageNumberElement.addEventListener("change", function (event) {
  pageNumber = parseInt(pageNumberElement.value);
  document.querySelector("#container").innerHTML = "";
  createCards(chunks[pageNumber - 1]);
  document.querySelector("#totalPages").innerHTML = num_chunks;
});

// get categories from server
fetch("/getCategories")
  .then((response) => response.json())
  .then((data) => {
    const bootstrapComponents = createCollapsible(data, "root");
    document.getElementById("categories-container").innerHTML =
      bootstrapComponents;
  });

// get the data from the server
fetch("/data")
  .then((response) => response.json())
  .then((data) => {
    createCards(data["res"]);
  });
