let displayTerm = "";
let searchStatus;

window.onload = (e) => {
    let search = document.querySelector("#search");
    search.onclick = searchButtonClicked;
    search.onkeyup = searchKeyEnter;
    document.querySelector("#searchterm").onkeyup = searchKeyEnter;
    searchStatus = document.querySelector("#status");
};

function searchKeyEnter(e) {
    if (e.key === "Enter") {
        searchButtonClicked();
    }
}

function searchButtonClicked() {
    // Get URL with api key
    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";
    const GIPHY_KEY = "U456VLD86rS7Hhn9yKhC0w8BNMAPyQmN";
    let url = GIPHY_URL + "api_key=" + GIPHY_KEY;

    // Get and clean Term
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;
    term.trim();
    term = encodeURIComponent(term)
    if (term.legnth < 1) return;
    url += "&q=" + term;

    // Get Limit
    let limit = document.querySelector("#limit").value;
    url += "&limit=" + limit;

    // Update UI
    searchStatus.innerHTML = `<b>Searching for '${displayTerm}'</b> <img id="spinner" src="images/spinner.gif" alt="">`;

    // Get Data
    getData(url);
}

function getData(url) {
    let xhr = new XMLHttpRequest();
    xhr.onload = dataLoaded;
    xhr.onerror = dataError;

    xhr.open("GET", url);
    xhr.send();
}

function dataLoaded(e) {
    // Parse JSON object
    let xhr = e.target;
    let obj = JSON.parse(xhr.responseText);

    // Return early if no data
    if (!obj.data || obj.data.length == 0) {
        searchStatus.innerHTML = `<b>No results found for '${displayTerm}'</b>`;
        return;
    }

    // Begin building search result content string
    let results = obj.data;
    let resultsString = `<p><i>Here are ${results.length} results for '${displayTerm}'</i></p>`;
    let contentString = "";
    
    // Foreach result, add to content string
    for (let i = 0; i < results.length; i++) {
        let result = results[i];

        let smallURL = result.images.fixed_width_downsampled.url;
        if (!smallURL) smallURL = "images/no-image-found.png";

        let url = result.url;

        let line = `
            <div class="result">
                <img src="${smallURL}" title="${result.id}"/>
                <span><a target="_blank" href="${url}">View on Giphy</a></span>
                <span>Rating: ${result.rating.toUpperCase()}</span>
            </div>
        `;
        contentString += line;
    }

    // Update UI
    document.querySelector("#results p").innerHTML = resultsString;
    document.querySelector("#content").innerHTML = contentString;
    searchStatus.innerHTML = "<b>Success!</b>";
}

function dataError(e) {
    console.log("An error has occurred.");
}