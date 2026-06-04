# The Reels Movie Search App

The Reels is a responsive movie search web app built with vanilla HTML, CSS, and JavaScript. It uses the OMDb API to search for movies, display movie posters, and let users sort and control how many movie cards appear on the page.

This project was created as a JavaScript final project with a focus on real-world frontend skills: API fetching, DOM manipulation, loading states, search functionality, sorting, responsive layout, and clean UI design.

## Live Features

- Search movies by title or keyword
- Display movie posters, titles, and release years
- Show movie details on hover when available from OMDb
- Sort results by:
  - A-Z
  - Z-A
  - Newest
  - Oldest
- Choose how many movies to display:
  - 6 movies
  - 9 movies
  - 12 movies
  - 15 movies
- Prevent duplicate movie results
- Show skeleton loading cards while searching
- Show a quick loading state when changing sort or display limit
- Show a friendly no-results state when no movies are found
- Handle empty searches and failed API requests
- Responsive design for desktop, tablet, and mobile screens

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- OMDb API

No frameworks or external JavaScript libraries were used.

## API Used

This project uses the OMDb API:

```text
https://www.omdbapi.com/
```

Main search format:

```text
https://www.omdbapi.com/?apikey=YOUR_KEY&s=SEARCH_TERM
```

Movie detail format:

```text
https://www.omdbapi.com/?apikey=YOUR_KEY&i=IMDB_ID
```

You can request a free API key here:

```text
https://www.omdbapi.com/apikey.aspx
```

## How to Use the App

1. Open `index.html` in a browser.
2. Type a movie title or keyword in the search bar.
3. Click the search button or press Enter.
4. Use the sort dropdown to reorder the results.
5. Use the show dropdown to choose how many movie cards to display.
6. Hover over a movie poster to see extra movie information when available.

## Project Structure

```text
The-Reels-Movie-Search-App/
├── assets/
│   ├── navbar-background.png
│   ├── stickman-watching-tv.png
│   └── the-reels-logo.png
├── index.html
├── style.css
├── script.js
└── README.md
```

## Main JavaScript Concepts Practiced

- Fetching data from an API
- Working with async and await
- Handling API errors
- Rendering dynamic HTML with JavaScript
- Updating the DOM based on user actions
- Sorting arrays of movie objects
- Filtering duplicate results
- Managing loading and empty states
- Responding to form submit events
- Building a responsive user interface

## Edge Cases Handled

- Empty search input
- Search with no matching movies
- Failed API request
- Movies with missing posters
- Fewer results than the selected display limit
- Duplicate movies returned by the API
- Sorting after results are already loaded
- Changing display limit after results are already loaded

## Design Direction

The design uses a cinematic purple and indigo theme inspired by movie theaters, film reels, and night-screen visuals. The layout was inspired by card-based listing websites, with a strong hero section, search bar, filters, movie cards, loading skeletons, and a clean empty state.

The goal was to make the app simple enough for a JavaScript course project, but polished enough to show in a frontend portfolio.

## Author

Created by Yves Bruno.

## Credits

- Movie data provided by the OMDb API
- Empty state illustration from IconScout

