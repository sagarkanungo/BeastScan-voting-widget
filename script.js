const API_URL = "https://my.beastscan.com/test-kit";
const container = document.getElementById("card-container");
const modal = document.getElementById("modal");
const editTitle = document.getElementById("edit-title");
const editDesc = document.getElementById("edit-description");
const saveBtn = document.getElementById("save-btn");
const closeBtn = document.getElementById("close-btn");
const addModal = document.getElementById("add-modal");
const loader = document.getElementById("loader");


let cardsData = [];
let editingIndex = null;

// Load data
async function loadCards() {
  loader.classList.remove("hidden"); 
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  const cached = localStorage.getItem("cards");
  if (cached) {
    cardsData = JSON.parse(cached);
    loader.classList.add("hidden");
  } else {
    try {
      const res = await fetch(API_URL);
      cardsData = await res.json();
      localStorage.setItem("cards", JSON.stringify(cardsData));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      cardsData = [];
    }
    finally {
      loader.classList.add("hidden"); 
    }
  }
  renderCards();
}

// Render
function renderCards() {
  container.innerHTML = "";
  cardsData.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.draggable = true;
    cardEl.dataset.index = index;

    cardEl.addEventListener("dragstart", () => {
      cardEl.classList.add("dragging");
    });

    cardEl.addEventListener("dragend", () => {
      cardEl.classList.remove("dragging");
    });

    cardEl.innerHTML = `
      <h3>${card.title}</h3>
      <p>${card.description}</p>
      <img src="${card.image}" alt="${card.title}" />
      <p>👍 <span>${card.votes.up}</span> 👎 <span>${card.votes.down}</span></p>
       <div class="button-container">
      <button onclick="upvote(${index})">Upvote</button>
      <button onclick="downvote(${index})">Downvote</button>
      <button onclick="editCard(${index})">Edit</button>
       <button class="delete-btn" onclick="deleteCard(${index})">Delete</button>
      </div>
       <a class="link" href="${card.button.url}" target="_blank">${card.button.label}</a>

    `;
    container.appendChild(cardEl);
  });
}

// Drag and Drop
container.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(container, e.clientY);
  const dragging = document.querySelector(".dragging");
  if (afterElement == null) {
    container.appendChild(dragging);
  } else {
    container.insertBefore(dragging, afterElement);
  }
});

container.addEventListener("drop", () => {
  const newOrder = Array.from(container.children).map((card) => {
    const index = card.dataset.index;
    return cardsData[index];
  });
  cardsData = newOrder;
  saveAndRender();
});

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll(".card:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Upvote / Downvote
function upvote(index) {
  cardsData[index].votes.up++;
  saveAndRender();
}

function downvote(index) {
  if (cardsData[index].votes.down > 0) {
    cardsData[index].votes.down--;
    saveAndRender();
  }
}

// Edit modal
function editCard(index) {
  editingIndex = index;
  editTitle.value = cardsData[index].title;
  editDesc.value = cardsData[index].description;
  modal.classList.remove("hidden");
}

saveBtn.onclick = () => {
  if (editingIndex !== null) {
    cardsData[editingIndex].title = editTitle.value;
    cardsData[editingIndex].description = editDesc.value;
    saveAndRender();
    modal.classList.add("hidden");
  }
};

closeBtn.onclick = () => {
  modal.classList.add("hidden");
};

// Sort by votes
function sortByVotes() {
  cardsData.sort((a, b) => b.votes.up - a.votes.up);
  saveAndRender();
}

// Reset all
async function resetAll() {
  try {
    const res = await fetch(API_URL);
    cardsData = await res.json();
    localStorage.setItem("cards", JSON.stringify(cardsData));
    renderCards();
  } catch (error) {
    console.error("Failed to reset data:", error);
  }
}

// Add new card
function openAddModal() {
  addModal.classList.remove("hidden");
}

function closeAddModal() {
  addModal.classList.add("hidden");
}

function saveNewIdea() {
  const title = document.getElementById("add-title").value;
  const description = document.getElementById("add-description").value;
  const image = document.getElementById("add-image").value;
  const url = document.getElementById("add-url").value;
  const label = document.getElementById("add-label").value;

  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  const newCard = {
    title,
    description,
    image,
    votes: { up: 0, down: 0 },
    button: {
      url,
      label,
    },
  };

  cardsData.push(newCard);
  saveAndRender();
  closeAddModal();

  // Clear input fields
  document.getElementById("add-title").value = '';
  document.getElementById("add-description").value = '';
  document.getElementById("add-image").value = '';
  document.getElementById("add-url").value = '';
  document.getElementById("add-label").value = '';
  
} 



function deleteCard(index) {
    if (confirm("Are you sure you want to delete this idea?")) {
      cardsData.splice(index, 1);
      saveAndRender();
    }
  }

function saveAndRender() {
  localStorage.setItem("cards", JSON.stringify(cardsData));
  renderCards();
}

// Initialize
loadCards();
