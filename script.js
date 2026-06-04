const API_KEY = "937b82ff";
    const API_URL = "https://www.omdbapi.com/";
    // Default search uses a modern year because OMDb has no true latest-movies feed.
    const DEFAULT_SEARCH_TERM = "movie";
    const DEFAULT_SEARCH_YEAR = String(new Date().getFullYear());
    const MAX_RESULTS = 15;
    const LOADING_DELAY_MS = 2000;
    const QUICK_UPDATE_DELAY_MS = 520;

    // DOM elements used throughout the app.
    const searchForm = document.querySelector("#searchForm");
    const searchInput = document.querySelector("#searchInput");
    const sortSelect = document.querySelector("#sortSelect");
    const limitSelect = document.querySelector("#limitSelect");
    const movieGrid = document.querySelector("#movieGrid");
    const emptyState = document.querySelector("#emptyState");
    const emptyHeading = document.querySelector("#emptyHeading");
    const emptyText = document.querySelector("#emptyText");
    const emptyActions = document.querySelector("#emptyActions");
    const resetButton = document.querySelector("#resetButton");
    const resultsTitle = document.querySelector("#resultsTitle");
    const resultsMeta = document.querySelector("#resultsMeta");
    const errorMessage = document.querySelector("#errorMessage");
    const loadingMessage = document.querySelector("#loadingMessage");

    // App state.
    let movies = [];
    let lastSearchTerm = "";
    let activeSearchId = 0;
    let quickUpdateTimer = null;

    // User interactions.
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSearch(searchInput.value);
    });

    sortSelect.addEventListener("change", () => {
      if (!movies.length) return;
      updateVisibleMoviesWithQuickLoading();
    });

    limitSelect.addEventListener("change", () => {
      if (!movies.length) return;
      updateVisibleMoviesWithQuickLoading();
    });

    window.addEventListener("DOMContentLoaded", () => {
      sortSelect.value = "newest";
      const initialSearchTerm = new URLSearchParams(window.location.search).get("search");

      if (initialSearchTerm) {
        searchInput.value = initialSearchTerm;
        handleSearch(initialSearchTerm);
        return;
      }

      handleSearch(DEFAULT_SEARCH_TERM, { year: DEFAULT_SEARCH_YEAR });
    });

    resetButton.addEventListener("click", () => {
      movies = [];
      lastSearchTerm = "";
      searchInput.value = "";
      sortSelect.value = "newest";
      limitSelect.value = "6";
      hideError();
      hideLoadingMessage();
      movieGrid.innerHTML = "";
      updateResultsHeader();
      handleSearch(DEFAULT_SEARCH_TERM, { year: DEFAULT_SEARCH_YEAR });
    });

    // Main search flow: validate input, show skeletons, fetch results, then render cards.
    async function handleSearch(rawSearchTerm, options = {}) {
      const searchTerm = rawSearchTerm.trim();
      const searchYear = options.year || "";

      hideError();
      hideLoadingMessage();

      if (!searchTerm) {
        activeSearchId += 1;
        movies = [];
        lastSearchTerm = "";
        movieGrid.innerHTML = "";
        updateResultsHeader();
        showEmptyState("Please enter a search term", "", false);
        searchInput.focus();
        return;
      }

      if (!API_KEY) {
        activeSearchId += 1;
        movies = [];
        lastSearchTerm = searchTerm;
        movieGrid.innerHTML = "";
        updateResultsHeader();
        showEmptyState("Add an OMDb API key", "", false);
        showError("This app needs an OMDb API key before it can load live movie results.");
        return;
      }

      lastSearchTerm = searchTerm;
      const searchId = activeSearchId + 1;
      activeSearchId = searchId;
      updateResultsHeader();
      hideEmptyState();
      showLoadingMessage();
      renderSkeletonCards(getSelectedLimit());

      try {
        const [fetchedMovies] = await Promise.all([
          fetchMovies(searchTerm, searchYear),
          wait(LOADING_DELAY_MS)
        ]);

        if (searchId !== activeSearchId) {
          return;
        }

        hideLoadingMessage();
        movies = await fetchMovieDetails(fetchedMovies.slice(0, MAX_RESULTS));

        if (!movies.length) {
          movieGrid.innerHTML = "";
          updateResultsHeader();
          resultsMeta.textContent = `0 movies shown. Display limit is ${getSelectedLimit()}.`;
          showEmptyState(
            "Could not find any matches related to your search.",
            "Please change the filter or reset it below",
            true
          );
          return;
        }

        renderMovies(getVisibleMovies());
        updateResultsHeader();
      } catch (error) {
        if (searchId !== activeSearchId) {
          return;
        }

        hideLoadingMessage();
        movies = [];
        movieGrid.innerHTML = "";
        updateResultsHeader();
        showError(error.message);
        showEmptyState("Something went wrong", "Please check your connection and try again.", true);
      }
    }

    // Fetch up to two OMDb result pages so the "Show 12/15" options can work.
    async function fetchMovies(searchTerm, searchYear = "") {
      const pages = await Promise.all([
        fetchMoviePage(searchTerm, 1, searchYear),
        fetchMoviePage(searchTerm, 2, searchYear)
      ]);

      const uniqueMovies = [];
      const seenIds = new Set();
      const seenTitleYears = new Set();

      pages.flat().forEach((movie) => {
        const titleYearKey = `${movie.Title || ""}-${movie.Year || ""}`.toLowerCase().replace(/\s+/g, " ").trim();

        if (movie.Type !== "movie" || !movie.imdbID || seenIds.has(movie.imdbID) || seenTitleYears.has(titleYearKey)) {
          return;
        }

        seenIds.add(movie.imdbID);
        seenTitleYears.add(titleYearKey);
        uniqueMovies.push(movie);
      });

      return uniqueMovies.slice(0, MAX_RESULTS);
    }

    async function fetchMoviePage(searchTerm, page, searchYear = "") {
      const yearQuery = searchYear ? `&y=${encodeURIComponent(searchYear)}` : "";
      const endpoint = `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}${yearQuery}&type=movie&page=${page}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Movie search failed. Please try again in a moment.");
      }

      const data = await response.json();

      if (data.Response === "False") {
        return [];
      }

      return Array.isArray(data.Search) ? data.Search : [];
    }

    // Fetch extra OMDb fields for the hover overlay.
    async function fetchMovieDetails(movieList) {
      const detailRequests = movieList.map(async (movie) => {
        if (!movie.imdbID) {
          return movie;
        }

        try {
          const endpoint = `${API_URL}?apikey=${API_KEY}&i=${encodeURIComponent(movie.imdbID)}&plot=short`;
          const response = await fetch(endpoint);

          if (!response.ok) {
            return movie;
          }

          const details = await response.json();

          if (details.Response === "False") {
            return movie;
          }

          return {
            ...movie,
            Plot: details.Plot,
            Genre: details.Genre,
            Runtime: details.Runtime,
            imdbRating: details.imdbRating
          };
        } catch (error) {
          return movie;
        }
      });

      return Promise.all(detailRequests);
    }

    // Small delay helper used to keep the skeleton visible for the assignment requirement.
    function wait(milliseconds) {
      return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
      });
    }

    // Render final movie cards and hover overlays.
    function renderMovies(movieList) {
      hideEmptyState();
      hideError();
      hideQuickUpdateLoading();
      movieGrid.innerHTML = "";

      movieList.forEach((movie) => {
        const card = document.createElement("article");
        card.className = "movie-card";

        const posterWrap = document.createElement("div");
        posterWrap.className = "poster-wrap";

        if (movie.Poster && movie.Poster !== "N/A") {
          posterWrap.classList.add("has-poster");
          posterWrap.style.setProperty("--poster-url", `url("${movie.Poster.replaceAll('"', "%22")}")`);

          const poster = document.createElement("img");
          poster.className = "movie-poster";
          poster.src = movie.Poster;
          poster.alt = `${movie.Title} poster`;
          poster.loading = "lazy";
          poster.addEventListener("error", () => {
            posterWrap.classList.remove("has-poster");
            posterWrap.style.removeProperty("--poster-url");
            poster.replaceWith(createPosterFallback());
          });
          posterWrap.appendChild(poster);
        } else {
          posterWrap.appendChild(createPosterFallback());
        }

        const overlay = document.createElement("div");
        overlay.className = "movie-overlay";

        const overlayTitle = document.createElement("span");
        overlayTitle.className = "overlay-label";
        overlayTitle.textContent = "More info";

        const overlayPlot = document.createElement("p");
        overlayPlot.className = "overlay-plot";
        overlayPlot.textContent = getMoviePlot(movie);

        const overlayMeta = document.createElement("p");
        overlayMeta.className = "overlay-meta";
        overlayMeta.textContent = getMovieMeta(movie);

        overlay.append(overlayTitle, overlayPlot, overlayMeta);
        posterWrap.appendChild(overlay);

        const body = document.createElement("div");
        body.className = "movie-body";

        const title = document.createElement("h3");
        title.className = "movie-title";
        title.textContent = movie.Title;

        const year = document.createElement("p");
        year.className = "movie-year";
        year.innerHTML = `
          <span class="year-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"/>
            </svg>
            ${movie.Year || "Year unknown"}
          </span>
        `;

        body.append(title, year);
        card.append(posterWrap, body);
        movieGrid.appendChild(card);
      });
    }

    function createPosterFallback() {
      const fallback = document.createElement("div");
      fallback.className = "poster-fallback";
      fallback.textContent = "Poster unavailable";
      return fallback;
    }

    // Render loading placeholders that match the selected display count.
    function renderSkeletonCards(cardCount = getSelectedLimit()) {
      hideQuickUpdateLoading();
      movieGrid.innerHTML = "";

      for (let index = 0; index < cardCount; index += 1) {
        const skeleton = document.createElement("article");
        skeleton.className = "skeleton-card";
        skeleton.setAttribute("aria-hidden", "true");
        skeleton.innerHTML = `
          <div class="skeleton-poster"></div>
          <div class="skeleton-body">
            <div class="skeleton-line title"></div>
            <div class="skeleton-meta-row">
              <div class="skeleton-dot"></div>
              <div class="skeleton-chip"></div>
            </div>
            <div class="skeleton-pill"></div>
          </div>
        `;
        movieGrid.appendChild(skeleton);
      }
    }

    // Sorting and result-limit helpers.
    function getVisibleMovies() {
      return sortMovies(movies, sortSelect.value).slice(0, getSelectedLimit());
    }

    function getSelectedLimit() {
      return Number.parseInt(limitSelect.value, 10) || 6;
    }

    function sortMovies(movieList, sortType) {
      const sortedMovies = [...movieList];

      sortedMovies.sort((firstMovie, secondMovie) => {
        const firstTitle = firstMovie.Title.toLowerCase();
        const secondTitle = secondMovie.Title.toLowerCase();
        const firstYear = getMovieYear(firstMovie.Year);
        const secondYear = getMovieYear(secondMovie.Year);

        if (sortType === "za") {
          return secondTitle.localeCompare(firstTitle);
        }

        if (sortType === "newest") {
          return secondYear - firstYear;
        }

        if (sortType === "oldest") {
          return firstYear - secondYear;
        }

        return firstTitle.localeCompare(secondTitle);
      });

      return sortedMovies;
    }

    function getMovieYear(yearValue) {
      const parsedYear = Number.parseInt(yearValue, 10);
      return Number.isNaN(parsedYear) ? 0 : parsedYear;
    }

    // Movie detail formatting helpers.
    function getMoviePlot(movie) {
      if (movie.Plot && movie.Plot !== "N/A") {
        return movie.Plot;
      }

      return "A short plot is not available for this title.";
    }

    function getMovieMeta(movie) {
      const details = [];

      if (movie.Genre && movie.Genre !== "N/A") {
        details.push(movie.Genre.split(",")[0]);
      }

      if (movie.Runtime && movie.Runtime !== "N/A") {
        details.push(movie.Runtime);
      }

      if (movie.imdbRating && movie.imdbRating !== "N/A") {
        details.push(`${movie.imdbRating}/10`);
      }

      return details.length ? details.join(" - ") : "Details from OMDb";
    }

    // UI state helpers.
    function updateResultsHeader() {
      const selectedLimit = getSelectedLimit();
      const visibleCount = Math.min(movies.length, selectedLimit);
      const countText = visibleCount === 1 ? "1 movie shown" : `${visibleCount} movies shown`;

      if (lastSearchTerm) {
        resultsTitle.textContent = "Movie Results";
        resultsMeta.textContent = movies.length ? `${countText}. Display limit is ${selectedLimit}.` : "Loading or waiting for results.";
        return;
      }

      resultsTitle.textContent = "Movie Results";
      resultsMeta.textContent = "Enter a keyword to start exploring movies.";
    }

    function showEmptyState(heading, text, showResetButton) {
      emptyHeading.textContent = heading;
      emptyText.textContent = text;
      emptyText.hidden = !text;
      emptyActions.hidden = !showResetButton;
      emptyState.hidden = false;
    }

    function updateVisibleMoviesWithQuickLoading() {
      clearTimeout(quickUpdateTimer);
      showQuickUpdateLoading();

      quickUpdateTimer = setTimeout(() => {
        renderMovies(getVisibleMovies());
        updateResultsHeader();
      }, QUICK_UPDATE_DELAY_MS);
    }

    function showQuickUpdateLoading() {
      movieGrid.classList.add("is-updating");
      sortSelect.disabled = true;
      limitSelect.disabled = true;
    }

    function hideQuickUpdateLoading() {
      movieGrid.classList.remove("is-updating");
      sortSelect.disabled = false;
      limitSelect.disabled = false;
    }

    function hideEmptyState() {
      emptyState.hidden = true;
    }

    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.hidden = false;
    }

    function hideError() {
      errorMessage.textContent = "";
      errorMessage.hidden = true;
    }

    function showLoadingMessage() {
      loadingMessage.textContent = "Loading movies...";
      loadingMessage.hidden = false;
    }

    function hideLoadingMessage() {
      loadingMessage.textContent = "";
      loadingMessage.hidden = true;
    }

