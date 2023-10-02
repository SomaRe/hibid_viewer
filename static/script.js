CHUNK_SIZE = 100;
pageNumber = 1;

pageNumberElement = document.querySelector("#pageNumber");


// function to create cards
function createCards(data) {
  for (item of data) {
    try {
      // create card
      card = document.createElement("div");
      card.className = "card m-2 " + item['category'].split(" - ").map((x) => x.replaceAll(" ", "_")).join(" ");
      // create image
      img = document.createElement("img");
      img.src = item['thumbnailLocation'];
      img.className = "card-img-top";
      // create card body
      card_body = document.createElement("div");
      card_body.className = "card-body";
      // create title
      title = document.createElement("h5");
      title.className = "card-title";
      title.innerHTML = item["lead"];
      // create highBid
      highBid = document.createElement("p");
      highBid.className = "card-text";
      highBid.innerHTML = "High Bid: " + item["highBid"];
      // create description
      description = document.createElement("p");
      description.className = "card-text";
      description.innerHTML = item["description"];
      // create link
      link = document.createElement("a");
      link.className = "btn btn-primary";
      link.innerHTML = "Open";
      console.log(item["lotId"]);
      link.href = `https://www.hibid.com/lot/${item["lotId"]}`;

      //add linkt to card data-link
      card.dataset.href = link.href;

      // append all elements
      card_body.appendChild(title);
      card_body.appendChild(highBid);
      card_body.appendChild(description);
      card_body.appendChild(link);
      card.appendChild(img);
      card.appendChild(card_body);
      // append card to body
      document.querySelector("#container").appendChild(card);
    } catch (err) {
      console.log(err);
    }
  }
}

// function to create category tree
function createCollapsible(category, parentId) {
  let output = '';
  let idx = 0;
  
  for (let key in category) {
      let id = `${parentId}-${idx}`;
      
      // Check if the category has sub-categories
      let hasSubcategories = Object.keys(category[key]).length > 0;

      output += `
<div>
<input type="checkbox" id="chk-${id}" name="chk-${id}" value="${key}">
<label for="chk-${id}">${key}</label>`;
      
      if (hasSubcategories) {
          output += `
<button class="btn btn-primary ml-2" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
  Toggle
</button>
<div class="collapse" id="${id}">
<div class="card card-body">
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
  checkboxes.forEach(checkbox => {
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
    createCards(data['res']);
  });
}

document.getElementById('filter-button').addEventListener('click', checkedCategories);

document.getElementById('search').addEventListener('click', function(event) {
  event.preventDefault();
  const searchQuery = document.getElementById('searchQuery').value;
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
    createCards(data['res']);
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
  const bootstrapComponents = createCollapsible(data, 'root');
  document.getElementById('categories-container').innerHTML = bootstrapComponents;
});

// get the data from the server
fetch("/data")
.then((response) => response.json())
.then((data) => {
    createCards(data['res']);
    
});

