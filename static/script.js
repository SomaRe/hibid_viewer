CHUNK_SIZE = 100;
pageNumber = 1;

let categoryFilters = [];

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
              <h5 class="card-title">${item["lead"]}</h5>    
              <img src="${item["thumbnailLocation"]}" class="card-img-top">
                  <div class="card-body">
                      <p class="card-text text">Date: ${item["eventDateEnd"]}</p>
                      <div class="d-flex justify-content-between">
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

    // Check if the category has sub-categories
    let hasSubcategories = Object.keys(category[key]).length > 0;

    output += `
<div class="cat-tree-row">
<input type="checkbox" id="chk-${id}" name="chk-${id}" value="${key}">
<label for="chk-${id}">${key}</label>`;

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

// function to get all checked categories
function checkedCategories() {
  const checkboxes = document.querySelectorAll('[id^="chk-"]');
  let checkedCategories = [];
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      checkedCategories.push(checkbox.value);
    }
  });
  fetch("/filterCategories", {
    method: "POST",
    body: JSON.stringify(checkedCategories),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      document.querySelector("#container").innerHTML = "";
      createCards(data["res"]);
    });
}

document
  .getElementById("filter-button")
  .addEventListener("click", checkedCategories);

document.getElementById("search").addEventListener("click", function (event) {
  event.preventDefault();
  const searchQuery = document.getElementById("searchQuery").value;
  fetch("/search", {
    method: "POST",
    body: JSON.stringify(searchQuery),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
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

document.querySelector("#toggle-button").addEventListener("click", () => {
  document.querySelector("#categories-container-main").style.display = "block";
});

document.querySelector("#close-categories").addEventListener("click", () => {
  document.querySelector("#categories-container-main").style.display = "none";
});

document.querySelector("#filter-button").addEventListener("click", () => {
  // find all input type checkbox, checked ones values are added to categoryFilters
  categoryFilters = [];
  document.querySelectorAll('input[type="checkbox"]:checked').forEach((el) => {
    categoryFilters.push(el.value);
  });
  fetch("/filterCategories", {
    method: "POST",
    body: JSON.stringify(categoryFilters),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      document.querySelector("#container").innerHTML = "";
      createCards(data["res"]);
    });
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
