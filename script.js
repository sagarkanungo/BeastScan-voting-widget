const API_URL = "https://my.beastscan.com/test-kit";
const container = document.getElementById("card-container");
const modal = document.getElementById("modal");
const editTitle = document.getElementById("edit-title");
const editDesc = document.getElementById("edit-description");
const editImage = document.getElementById("edit-image");
const editUrl = document.getElementById("edit-url");
const editLabel = document.getElementById("edit-label");
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

  try {
    const res = await fetch(API_URL);
    cardsData = await res.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
    cardsData = [];
  } finally {
    loader.classList.add("hidden");
  }

  renderCards();
}

// Render
function renderCards() {
  if (!container) return;
  container.innerHTML = "";

  cardsData.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.draggable = true;
    cardEl.dataset.index = index;
    cardEl.id = `card-${index}`;
    console.log("cardEl", cardEl.id);

    cardEl.addEventListener("dragstart", () => {
      cardEl.classList.add("dragging");
    });

    cardEl.addEventListener("dragend", () => {
      cardEl.classList.remove("dragging");
    });

    // Handle null or undefined fields in the card object
    const title = card.title || "No Title";
    const description = card.description || "No Description";
    const image =
      card.image || "https://my.beastscan.com/images/beastscan-qr-code.png";
    const upvotes = card.votes?.up || 0;
    const downvotes = card.votes?.down || 0;
    const buttonUrl = card.button?.url || "#";
    const buttonLabel = card.button?.label || "Learn More";

    cardEl.innerHTML = `
      <h3>${title}</h3>
      <p>${description}</p>
      <img src="${image}" alt="${title}" />
      <p>👍 <span>${upvotes}</span> 👎 <span>${downvotes}</span></p>
      <div class="button-container">
        <button onclick="upvote(${index})">Upvote</button>
        <button onclick="downvote(${index})">Downvote</button>
        <button onclick="editCard(${index})">Edit</button>
        <button class="delete-btn" onclick="deleteCard(${index})">Delete</button>
      </div>
      <a class="link" href="${buttonUrl}" target="_blank">${buttonLabel}</a>
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
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Upvote / Downvote
function upvote(index) {
  if (cardsData[index].votes) {
    cardsData[index].votes.up++;
    saveAndRender();
  }
}

function downvote(index) {
  if (cardsData[index].votes?.down > 0) {
    cardsData[index].votes.down--;
    saveAndRender();
  }
}

// Edit modal
function editCard(index) {
  editingIndex = index;
  const card = cardsData[index];

  editTitle.value = card.title;
  editDesc.value = card.description;
  editImage.value = card.image || "";
  editUrl.value = card.button.url || "";
  editLabel.value = card.button.label || "";

  modal.classList.remove("hidden");
}

saveBtn.onclick = () => {
  if (editingIndex !== null) {
    cardsData[editingIndex].title = editTitle.value.trim();
    cardsData[editingIndex].description = editDesc.value.trim();
    cardsData[editingIndex].image = editImage.value.trim();
    cardsData[editingIndex].url = editUrl.value.trim();
    cardsData[editingIndex].label = editLabel.value.trim();

    saveAndRender();
    modal.classList.add("hidden");
  }
};

closeBtn.onclick = () => {
  modal.classList.add("hidden");
};

// Sort by votes
function sortByVotes() {
  cardsData.sort((a, b) => (b.votes?.up || 0) - (a.votes?.up || 0));
  saveAndRender();
}

// Reset all
async function resetAll() {
  try {
    const res = await fetch(API_URL);
    cardsData = await res.json();
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
  const title = document.getElementById("add-title").value.trim();
  const description = document.getElementById("add-description").value.trim();
  const image =
    document.getElementById("add-image").value.trim() ||
    "https://my.beastscan.com/images/beastscan-qr-code.png";
  const url = document.getElementById("add-url").value.trim();
  const label = document.getElementById("add-label").value.trim();

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
  document.getElementById("add-title").value = "";
  document.getElementById("add-description").value = "";
  document.getElementById("add-image").value = "";
  document.getElementById("add-url").value = "";
  document.getElementById("add-label").value = "";
}

function deleteCard(index) {
  if (confirm("Are you sure you want to delete this idea?")) {
    cardsData.splice(index, 1);
    saveAndRender();
  }
}

function saveAndRender() {
  renderCards();
}

// Initialize
loadCards();
