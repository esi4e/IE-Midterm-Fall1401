// this class contains all the result of a search except
// the favorite language.
class SearchInfo {
  constructor() {}
  bio;
  location;
  fullName;
  url;
  message;
  documentation_url;
}

// this function gets an array and returns the
// most occured element or mod of the array
function maxOcurr(array) {
  if (array.length == 0) return null;
  var modeMap = {};
  var maxEl = array[0],
    maxCount = 1;
  for (var i = 0; i < array.length; i++) {
    var el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}

// this function gets the favorite language of the user based
// on its 5 repositories and the json "language" key
function getFavoriteLanguage(repos) {
  let counter = 0;
  let langarr = [];

  repos.forEach((repo_json) => {
    if (counter <= 5 && repo_json.language !== null) {
      langarr.push(repo_json.language);
    }

    counter += 1;
  });

  let favorite_language = maxOcurr(langarr);
  return favorite_language;
}

// this function will put the favorite language of the user
// into the webpage
function putRepInfoToSite(fav_lang) {
  document.getElementById("info-lang").innerText = fav_lang
    ? "favorite language: " + fav_lang
    : "no language specified";
}

// this function is called whenever the username is correct which
// is when it does not contain any whitespace in it. it will retrieve
// the repositories from database or local storage.
function handleUserInfo(user_url, repos_url) {
  let result = Object.create(SearchInfo);
  user_json = JSON.parse(localStorage.getItem(user_url));
  extractInfo(user_json, result);

  if (user_json.message == "Not Found") {
    // nothing to do here :)
  } else {
    avatar_url = user_json.avatar_url;

    fetch(avatar_url)
      .then(
        (response) => response.blob(),
        (reason) => {
          putErrToPage(
            `Error retreiving avatar, error message: ${reason.message}`
          );
        }
      )
      .then((content) => {
        let img = document.createElement("img");
        img.src = URL.createObjectURL(content);
        img.alt = "cannot load image";
        img.style.width = "7em";
        img.style.height = "8em";
        img.style.border = "dotted";
        img.style.borderWidth = "0.1em";
        img.style.borderColor = "inherit";
        img.style.borderRadius = "4px";
        img.id = "user-img";
        if (document.getElementById("user-img")) {
          console.log("[X]IF1");
          document.getElementById("user-img").replaceWith(img);
        } else {
          document.getElementById("user-image-div").appendChild(img);
          console.log("[Y]IF2");
        }
      });

    console.log("INSIDE  FOUND");
    if (localStorage.getItem(repos_url)) {
      console.log("found repos url in local storage");
      console.log(localStorage.getItem(repos_url));
      console.log(typeof localStorage.getItem(repos_url));
      repos_json = JSON.parse(localStorage.getItem(repos_url));
      displayRepositories(repos_json);
      fav_lang = getFavoriteLanguage(repos_json);

      putRepInfoToSite(fav_lang);
    } else {
      fetchRepos(repos_url);
    }
  }
  putInfoToSite(result);
}

// this function is called whenever the client presses the
// submit button. it will handle the client request.
function getUser(event) {
  event.preventDefault();

  let user_name = document.getElementById("gitname").value;
  console.log(user_name);
  // whitespace in username is unacceptable
  if (hasWhiteSpace(user_name)) {
    document.getElementById("info-name").innerHTML =
      "The username must not contain whitespaces";
    let result = Object.create(SearchInfo);
    result.message = "The username must not contain any whitespace!!!";
    putInfoToSite(result);
    return;
  }

  let user_url = "https://api.github.com/users/" + user_name;
  let repos_url = user_url + "/repos";

  console.log(user_url);
  if (localStorage.getItem(user_url)) {
    console.log("found user url in local storage");
    console.log(localStorage.getItem(user_url));
    console.log(typeof localStorage.getItem(user_url));
    user_json = JSON.parse(localStorage.getItem(user_url));
    handleUserInfo(user_url, repos_url);
  } else {
    fetchUserAndRep(user_url, repos_url);
    // return;
  }
}

// getting the result as the input and putting it inside the
// the html element. it can put errors and user information (except
// user's favorite language and avatar) which are handles inside the
// handleUserInfo() function
function putInfoToSite(result) {
  if (result.message === "Found") {
    info = document.getElementById("main");

    p_name = document.getElementById("info-name");
    p_location = document.getElementById("info-location");
    p_bio = document.getElementById("info-bio");

    document.getElementById("info-url").innerText = result.url;
    p_name.innerText = result.fullName;
    p_location.innerText = result.location;
    p_bio.innerText = result.bio;

    let error_div = document.createElement("div");
    error_div.innerText = "";
    error_div.id = "error-div-contain";
    document.getElementById("error-div-contain").replaceWith(error_div);
  } else {
    putErrToPage(result.message);
  }
}

// this console function prints
function printInfo(result) {
  console.log("printing printInfo");

  if (result.message === "the requested username does not exist") {
    console.log(result.message);
    console.log(result.documentation_url);
  } else if (result.message === "Found") {
    result.bio = result.bio.replace(/\r\n/, "");
    console.log(result.bio);
    console.log(result.location);
    console.log(result.fullName);
  }
}

// this function gets the user_json
function extractInfo(user_json, result) {
  if (user_json.message == "Not Found") {
    result.message = "the requested username does not exist";
    result.documentation_url = user_json.documentation_url;
  } else {
    result.bio = user_json.bio ? user_json.bio : "";
    result.fullName = user_json.name ? user_json.name : "";
    result.location = user_json.location ? user_json.location : "";
    result.url = user_json.url ? user_json.url : "";
    result.message = "Found";
  }
}

// returns if the inputs string s contains any whitespace,
// this also includes the whitespace at the beginning and
// the end of the string
function hasWhiteSpace(s) {
  return s.indexOf(" ") >= 0;
}

// puts the input string message inside an html
// element designed to display error message
function putErrToPage(message) {
  let error_div = document.createElement("div");
  error_div.innerHTML = `<p> ${message} </p>`;
  error_div.id = "error-div-contain";
  error_div.style.float = "right";
  document.getElementById("error-div-contain").replaceWith(error_div);
}

// fetches the user_url from github and saves into the local storage
// and displays any network errors if available. also calls the handleUserInfo
//function which will fetch the repository if not available in local storage
function fetchUserAndRep(user_url, repos_url) {
  console.log("user url not found in local storage");
  console.log(localStorage.getItem(user_url));
  console.log("fetching user_url from github...");
  fetch(user_url)
    .then(
      (response) => response.json(),
      (reason) => {
        console.log("reason in sending:");
        console.log(reason);
        putErrToPage(`Printing error info: ${reason.message}`);
      }
    )
    .then(
      (data) => {
        console.log("data is:");
        console.log(data);
        localStorage.setItem(user_url, JSON.stringify(data));

        handleUserInfo(user_url, repos_url);
      },
      (reason) => {
        console.log("reason:");
        console.log(reason);
      }
    );
}

// displays the user repositories in the console
// NOT the web page
function displayRepositories(repos) {
  let counter = 1;
  repos.forEach((repo_json) => {
    Object.entries(repo_json).forEach((entry) => {
      const [key, value] = entry;

      console.log(
        counter +
          "{" +
          key +
          "=i=" +
          value +
          " " +
          typeof key +
          typeof value +
          "}"
      );
    });
    counter += 1;
  });
}

// fetches all user's repositories and saves them into the local storage, also
// displays user's favorite language in the web page
function fetchRepos(repos_url) {
  console.log(
    "could not find repos url in local storage \r\n fetching from github..."
  );

  fetch(repos_url)
    .then(
      (response) => response.json(),
      (reason) => {
        console.log("reason in sending:");
        console.log(reason);
        putErrToPage(
          `Printing error info while retrieving repository: ${reason.message}`
        );
      }
    )
    .then(
      (data) => {
        console.log("data is:");
        console.log(data);
        console.log("saving repos url data to local storage");
        localStorage.setItem(repos_url, JSON.stringify(data));
        repos_json = JSON.parse(localStorage.getItem(repos_url));
        displayRepositories(repos_json);
        fav_lang = getFavoriteLanguage(repos_json);

        putRepInfoToSite(fav_lang);
      },
      (reason) => {
        console.log("reason:");
        console.log(reason);
      }
    )
    .catch((error) => console.error("Error" + error));
}
