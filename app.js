const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: 6,
  },
  bookmarks: [],
  theme: 'light'
};

const API_URL = 'https://forkify-api.herokuapp.com/api/v2/recipes';

// DOM Element References
const elements = {
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  resultsList: document.getElementById('results-list'),
  pagination: document.getElementById('pagination'),
  recipeView: document.getElementById('recipe-view'),
  bookmarksList: document.getElementById('bookmarks-list'),
  addRecipeForm: document.getElementById('add-recipe-form'),
  themeToggleBtn: document.getElementById('btn-theme-toggle')
};

const renderSpinner = function (parentElement) {
  const markup = `
        <div class="spinner">
          <i class="fa-solid fa-spinner"></i>
        </div>
      `;
  parentElement.innerHTML = '';
  parentElement.insertAdjacentHTML('afterbegin', markup);
};

const persistBookmarks = function () {
  localStorage.setItem('forkify_bookmarks', JSON.stringify(state.bookmarks));
};

const loadStorage = function () {
  const storageBookmarks = localStorage.getItem('forkify_bookmarks');
  if (storageBookmarks) state.bookmarks = JSON.parse(storageBookmarks);

  const storageTheme = localStorage.getItem('forkify_theme') || 'light';
  state.theme = storageTheme;
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
};

const loadSearchResults = async function (query) {
  try {
    renderSpinner(elements.resultsList);
    state.search.query = query;

    const res = await fetch(`${API_URL}?search=${query}`);
    const data = await res.json();

    if (!res.ok || data.data.recipes.length === 0) {
      throw new Error('No recipes found for your query. Please try another one!');
    }

    state.search.results = data.data.recipes.map(rec => ({
      id: rec.id,
      title: rec.title,
      publisher: rec.publisher,
      image: rec.image_url,
    }));

    state.search.page = 1;
    renderSearchResults();
  } catch (err) {
    elements.resultsList.innerHTML = `
          <div class="error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${err.message}</p>
          </div>
        `;
  }
};

const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  return state.search.results.slice(start, end);
};

const renderSearchResults = function () {
  const results = getSearchResultsPage();
  const markup = results.map(rec => `
        <li>
          <a class="preview__link ${state.recipe.id === rec.id ? 'preview__link--active' : ''}" onclick="controlRecipe('${rec.id}')">
            <figure class="preview__fig">
              <img src="${rec.image}" alt="${rec.title}" />
            </figure>
            <div class="preview__data">
              <h4 class="preview__title">${rec.title}</h4>
              <p class="preview__publisher">${rec.publisher}</p>
            </div>
          </a>
        </li>
      `).join('');

  elements.resultsList.innerHTML = markup;
  renderPagination();
};

const renderPagination = function () {
  const numPages = Math.ceil(state.search.results.length / state.search.resultsPerPage);
  const currentPage = state.search.page;
  let markup = '';

  if (currentPage === 1 && numPages > 1) {
    markup = `
          <div></div>
          <button class="btn--inline" onclick="changePage(${currentPage + 1})">
            <span>Page ${currentPage + 1}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        `;
  } else if (currentPage === numPages && numPages > 1) {
    markup = `
          <button class="btn--inline" onclick="changePage(${currentPage - 1})">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Page ${currentPage - 1}</span>
          </button>
        `;
  } else if (currentPage < numPages) {
    markup = `
          <button class="btn--inline" onclick="changePage(${currentPage - 1})">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Page ${currentPage - 1}</span>
          </button>
          <button class="btn--inline" onclick="changePage(${currentPage + 1})">
            <span>Page ${currentPage + 1}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        `;
  }

  elements.pagination.innerHTML = markup;
};

window.changePage = function (goToPage) {
  state.search.page = goToPage;
  renderSearchResults();
};

const controlRecipe = async function (id) {
  try {
    renderSpinner(elements.recipeView);
    renderSearchResults(); // update active state highlights

    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();

    if (!res.ok) throw new Error('Could not fetch target recipe details.');

    let { recipe } = data.data;
    state.recipe = {
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      sourceUrl: recipe.source_url,
      image: recipe.image_url,
      servings: recipe.servings || 4,
      cookingTime: recipe.cooking_time || 45,
      ingredients: recipe.ingredients,
      bookmarked: state.bookmarks.some(b => b.id === recipe.id)
    };

    renderRecipe();
  } catch (err) {
    elements.recipeView.innerHTML = `
          <div class="error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${err.message}</p>
          </div>
        `;
  }
};

const renderRecipe = function () {
  const markup = `
        <figure class="recipe__fig">
          <img src="${state.recipe.image}" alt="${state.recipe.title}" class="recipe__img" />
          <h1 class="recipe__title">
            <span>${state.recipe.title}</span>
          </h1>
        </figure>

        <div class="recipe__details">
          <div class="recipe__info">
            <i class="fa-regular fa-clock recipe__info-icon"></i>
            <span class="recipe__info-data">${state.recipe.cookingTime}</span>
            <span class="recipe__info-text">minutes</span>
          </div>
          <div class="recipe__info">
            <i class="fa-solid fa-users recipe__info-icon"></i>
            <span class="recipe__info-data">${state.recipe.servings}</span>
            <span class="recipe__info-text">servings</span>

            <div class="recipe__info-buttons">
              <button class="btn--tiny" onclick="updateServings(${state.recipe.servings - 1})">
                <i class="fa-solid fa-minus"></i>
              </button>
              <button class="btn--tiny" onclick="updateServings(${state.recipe.servings + 1})">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <button class="btn--round" onclick="toggleBookmark()">
            <i class="${state.recipe.bookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
          </button>
        </div>

        <div class="recipe__ingredients">
          <h2 class="heading--2">Recipe ingredients</h2>
          <ul class="recipe__ingredient-list">
            ${state.recipe.ingredients.map(ing => `
              <li class="recipe__ingredient">
                <i class="fa-solid fa-check recipe__icon"></i>
                <div class="recipe__quantity">${ing.quantity ? ing.quantity : ''}</div>
                <div class="recipe__description">
                  <span class="recipe__unit">${ing.unit || ''}</span>
                  ${ing.description}
                </div>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="recipe__directions">
          <h2 class="heading--2">How to cook it</h2>
          <p class="recipe__directions-text">
            This recipe was carefully designed and tested by
            <span class="recipe__publisher">${state.recipe.publisher}</span>. Please check out
            directions at their website.
          </p>
          <a class="btn-grad" href="${state.recipe.sourceUrl}" target="_blank">
            <span>Directions</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      `;

  elements.recipeView.innerHTML = markup;
};

window.updateServings = function (newServings) {
  if (newServings <= 0) return;
  state.recipe.ingredients.forEach(ing => {
    if (ing.quantity) {
      ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    }
  });
  state.recipe.servings = newServings;
  renderRecipe();
};

window.toggleBookmark = function () {
  if (!state.recipe.bookmarked) {
    state.recipe.bookmarked = true;
    state.bookmarks.push(state.recipe);
  } else {
    state.recipe.bookmarked = false;
    const index = state.bookmarks.findIndex(el => el.id === state.recipe.id);
    state.bookmarks.splice(index, 1);
  }
  persistBookmarks();
  renderRecipe();
  renderBookmarksModal();
};

const renderBookmarksModal = function () {
  if (state.bookmarks.length === 0) {
    elements.bookmarksList.innerHTML = `
          <div class="p-3 text-center text-muted">
            No bookmarked recipes yet. Find a good recipe and bookmark it!
          </div>
        `;
    return;
  }

  const markup = state.bookmarks.map(bm => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3 cursor-pointer" onclick="controlRecipe('${bm.id}')" data-bs-dismiss="modal">
            <img src="${bm.image}" alt="${bm.title}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
            <div>
              <h6 class="mb-0 text-truncate" style="max-width: 200px;">${bm.title}</h6>
              <small class="text-muted">${bm.publisher}</small>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteBookmark('${bm.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </li>
      `).join('');

  elements.bookmarksList.innerHTML = markup;
};

window.deleteBookmark = function (id) {
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);
  if (state.recipe.id === id) state.recipe.bookmarked = false;
  persistBookmarks();
  renderBookmarksModal();
  if (state.recipe.id === id) renderRecipe();
};

elements.addRecipeForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);

  const rawIngs = data.ingredients.split(',');
  const ingredients = rawIngs.map(ing => {
    const parts = ing.split(';');
    return {
      quantity: parts[0] ? +parts[0] : null,
      unit: parts[1] || '',
      description: parts[2] || parts[0]
    };
  });

  const newRecipe = {
    id: 'custom-' + Date.now(),
    title: data.title,
    publisher: data.publisher,
    sourceUrl: data.sourceUrl,
    image: data.image,
    servings: +data.servings,
    cookingTime: +data.cookingTime,
    ingredients: ingredients,
    bookmarked: true
  };

  state.recipe = newRecipe;
  state.bookmarks.push(newRecipe);
  persistBookmarks();
  renderRecipe();
  renderBookmarksModal();

  // Close modal dynamically
  const modalEl = document.getElementById('addRecipeModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
  this.reset();
});

const updateThemeIcon = function () {
  const icon = elements.themeToggleBtn.querySelector('i');
  if (state.theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
};

elements.themeToggleBtn.addEventListener('click', function () {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('forkify_theme', state.theme);
  updateThemeIcon();
});

elements.searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const query = elements.searchInput.value.trim();
  if (query) loadSearchResults(query);
});

document.getElementById('btn-bookmarks').addEventListener('click', renderBookmarksModal);

const init = function () {
  loadStorage();
  loadSearchResults('pizza'); // Default landing query matching reference setup
};

init();