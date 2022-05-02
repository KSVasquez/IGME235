// Consts
const API_URL_V3 = "https://api.jikan.moe/v3/search/anime"; // Deprecated
const API_URL_V4 = "https://api.jikan.moe/v4/anime";
const LIMIT = 5;
const S_PREFIX = "ksv3212-";

// Vars
let term = "";
let animeData;
let retry = [];
let page = 0;
let pageCount = 0;
let simul = 0;

// Set init
window.onload = init;


// Initialization
function init() {
    // Submit Button
    let button = document.querySelector("#searchButton");
    button.onclick = searchSubmit;
    button.onkeyup = searchKeyEnter;

    // Search Field
    let field = document.querySelector("#searchField");
    field.onkeyup = searchKeyEnter;
    // Get stored field
    let fieldKey = S_PREFIX + "field";
    let storedField = localStorage.getItem(fieldKey);
    if (storedField) field.value = storedField;
    field.onchange = (e) => { localStorage.setItem(fieldKey, e.target.value); };

    // Sort Select
    let sort = document.querySelector("#searchSort");
    sort.addEventListener("change", searchSortChange);
    // Get stored sort
    let sortKey = S_PREFIX + "sort";
    let storedSort = localStorage.getItem(sortKey);
    if (storedSort) sort.value = storedSort;
    sort.addEventListener("change", (e) => { localStorage.setItem(sortKey, e.target.value); });

    // Nav Buttons
    let next = document.querySelector("#navNext");
    next.onclick = nextPage;
    let back = document.querySelector("#navBack");
    back.onclick = backPage;
}

// Event to handle "enter" in search field
function searchKeyEnter(e) {
    if (e.key === "Enter") {
        searchSubmit();
    }
}

// Events to update the current results page
function searchSortChange(e) {
    if (animeData) {
        buildAnime();
    }
}
function nextPage(e) {
    if (animeData) {
        page++;
        buildAnime();
    }
}
function backPage(e) {
    if (animeData) {
        page = Math.max(page - 1, 0);
        buildAnime();
    }
}
function toPage(p) {
    if (animeData) {
        page = p;
        buildAnime();
    }
}

// Builds a query URL
function searchSubmit() {
    let sorter = document.querySelector("#searchSort");
    if (sorter.value == "default") { sorter.value = "default"; }

    // Add query parameter
    let url = API_URL_V4 + "?q=";
    term = document.querySelector("#searchField").value;
    term = term.trim();
    term = encodeURIComponent(term);

    if (!term.length) return;
    url += term;

    // Add SFW parameter
    url += "&sfw";

    // Update UI
    document.querySelector("#status").innerHTML = "Searching...";
    page = 0;


    // Get anime data
    getAnimeData(url);
}


// ======================================================================================
// Anime
// ======================================================================================
// Sends a XHR for anime
function getAnimeData(url) {
    let xhr = new XMLHttpRequest();
    xhr.onload = animeDataLoaded;
    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

// Data error debug
function dataError(e) {
    console.log("An error occurred");
}

// Checks and stores the anime data
function animeDataLoaded(e) {
    // Parse JSON object
    let xhr = e.target;
    let obj = JSON.parse(xhr.responseText);
    // Return early if error in data
    if (obj.error) {
        document.querySelector("#status").innerHTML = obj.error;
        return;
    }

    // Get results
    let results = obj.data;
    // Return early if no data
    if (!results || results.length <= 0) {
        document.querySelector("#status").innerHTML = `No results for "${term}"`;
        return;
    }

    // Store data
    pageCount = Math.ceil(results.length / LIMIT);
    for (let i = 0; i < results.length; i++) {
        results[i].relevancy = i;
    }
    animeData = results;

    // Build anime results
    buildAnime();
}

// Sorts anime results by sorting controls
function sortAnime(results) {
    // Get the sorting settings
    let searchSorting = document.querySelector("#searchSort").value.split(" ");

    // Sort by title or by date
    let order = searchSorting[0];
    switch (order) {
        case "title":
            results.sort((a, b) => { return a.title < b.title ? 1 : -1 });
            break;
        case "start_date":
            results.sort((a, b) => {
                if (a.aired.from == null) return 1;
                return a.aired.from > b.aired.from ? 1 : -1
            });
            break;
        case "relevant":
            results.sort((a, b) => { return a.relevancy < b.relevancy ? -1 : 1 });
            break;
        default:
            break;
    }

    // Reverse order if descending
    let sort = searchSorting[1];
    if (sort == "desc") {
        results.reverse();
    }

    // Return sorted results
    return results;
}

// Builds the anime results HTML element from stored anime data
function buildAnime() {
    // Sort the results (Because the API can't)
    animeData = sortAnime(animeData);

    // Begin building search result content string
    let limit = Math.min(LIMIT, animeData.length);
    let start = page * limit;
    let end = Math.min(start + limit, animeData.length);
    let resultsString = `<p><i>Here are <b>${limit}</b> of
        <b>${animeData.length}</b> results!</i></p>`;

    // Create each anime result
    for (let i = start; i < end; i++) {
        let result = animeData[i];
        let url = result.url;
        let title = result.title;
        let date = result.aired.prop.from.year;
        if (date == null) date = "N/A";
        let image = result.images.jpg.image_url;

        let line = `
            <div id="a${result.mal_id}" class="result">
                <div class="anime">
                    <img class="animeImage" src="${image}">
                    <p class="title"><a href="${url}">${title}</a></p>
                    <p class="year">${date}</p>
                </div>
                <div class="charas">
                    <img id="loading" src="images/spinner.gif" alt="">
                </div>
            </div>
        `;
        resultsString += line;
    }

    // Update page with anime
    document.querySelector("#content").innerHTML = resultsString;

    // Create nav buttons
    createNavButtons();

    // Create each character result
    createAllCharas();
    document.querySelector("#status").innerHTML = "Querying...";
}

// Create the page numbers and hide/show the next/back buttons
function createNavButtons() {
    let limit = Math.min(LIMIT, animeData.length);
    let start = page * limit;
    // If there is more than one page...
    if (LIMIT < animeData.length) {
        // Set next/back button visibilities
        let next = document.querySelector("#navNext").style;
        let back = document.querySelector("#navBack").style;
        if (start + LIMIT < animeData.length) {
            next.visibility = "visible";
        } else {
            next.visibility = "hidden";
        }
        if (page > 0) {
            back.visibility = "visible";
        } else {
            back.visibility = "hidden";
        }

        // Create page number for each page
        let pageString = "";
        let navPage = document.querySelector("#pages");
        for (let i = 0; i < pageCount; i++) {
            if (i != page) {
                pageString += `<p class="navPage"><a href="#" data-page="${i}" onclick="toPage(${i})">${i + 1}</a></p>`;
            } else {
                pageString += `<p class="navPage">${i + 1}</p>`;
            }
        }
        navPage.innerHTML = pageString;
    }
}


// ======================================================================================
// Characters & Voice Actors
// ======================================================================================
// Creates each character result in its corresponding anime div
async function createAllCharas() {
    simul++;
    let instance = simul;
    retry = [];

    let limit = Math.min(5, animeData.length);
    let start = page * limit;
    let end = Math.min(start + limit, animeData.length);

    // For each anime, build a character list every .4 seconds
    for (let i = start; i < end; i++) {
        // Sleep to avoid rate limit
        await sleep(433);
        // Quit if another createAllCharas() is called
        if (instance > simul) { simul--; return; }

        let result = animeData[i];
        getCharaData(result.mal_id);
    }

    // For each failed character list, retry again every .6 seconds
    for (let m of retry) {
        await sleep(633); // Sleep to avoid rate limit
        getCharaData(m);
    }

    document.querySelector("#status").innerHTML = "Done! Ready to search.";
}
// Sleep, with 'await', waits 'ms' milliseconds to resolve
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Sends a XHR for characters 
function getCharaData(mal_id) {
    let charaUrl = API_URL_V4 + `/${mal_id}/characters`;

    let xhr = new XMLHttpRequest();
    xhr.onload = charaDataLoaded;
    xhr.onerror = dataError;
    // Probably not the best method, but needed to pass this ID somehow to get async working
    xhr.mal_id = mal_id;

    xhr.open("GET", charaUrl);
    xhr.send();
}

// Builds the anime results HTML element from stored anime data
function charaDataLoaded(e) {
    // Parse JSON object
    let xhr = e.target;
    let obj = JSON.parse(xhr.responseText);
    let anime = document.querySelector(`#a${xhr.mal_id} .charas`);

    // Return early if error in data
    if (obj.error) {
        if (anime) {
            anime.innerHTML = "<p><i>Something went wrong.</i></p>";
        }
        return;
    }

    // Return early if error in data
    if (obj.status == "429") {
        if (anime) {
            anime.innerHTML = "<p><i>Error in the API! To many requests...</i></p>";
        }
        retry.push(xhr.mal_id);
        return;
    }

    // Get results
    let charas = obj.data;
    // Return early if no data
    if (!charas || charas.length <= 0) {
        if (anime) {
            anime.innerHTML = "<p><i>Nobody found.</i></p>";
        }
        return;
    }

    // Filter character list for main characters
    charas = charas.filter((c) => { return c.role == "Main" });

    // Build the characters string
    let charasString = "";
    for (let i = 0; i < charas.length; i++) {
        // First half, build the character element
        let chara = charas[i];
        let cUrl = chara.character.url;
        let cName = chara.character.name;
        let cImage = chara.character.images.jpg.image_url;
        let line = `
        <div class="pairSeiyuu">
            <div class="chara">
                <img class="charaImage" src="${cImage}">
                <p class="name"><a href="${cUrl}">${cName}</a></p>
            </div>
        `;

        // Second half, build the voice actor element
        // Find the Japanese voice actor
        let seiyuu = chara.voice_actors.find(s => s.language == "Japanese");
        // If found, build the voice actor element
        if (seiyuu) {
            let sUrl = seiyuu.person.url;
            let sName = seiyuu.person.name;
            let sImage = seiyuu.person.images.jpg.image_url;
            line += `
                <div class="seiyuu">
                    <img class="charaImage" src="${sImage}">
                    <p class="name"><a href="${sUrl}">${sName}</a></p>
                </div>
            </div>
            `;
            // Else, build a default placeholder element
        } else {
            line += `
                <div class="seiyuu">
                    <img class="charaImage" src="https://via.placeholder.com/200x310?text=N%2FA">
                    <p class="name">N/A</p>
                </div>
            </div>
            `;
        }

        // Append line to characters string
        charasString += line;
    }

    // Update anime with chara
    if (anime) {
        anime.innerHTML = charasString;
    }
}