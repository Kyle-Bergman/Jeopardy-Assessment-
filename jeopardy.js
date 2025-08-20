let categories = [];
const numOfCategories = 6;
const numOfClues = 5;

/** Local fallback categories */
const fallbackCategories = [
  {
    title: "Video Games",
    clues: [
      { question: "What year was the original PlayStation released?", answer: "1994", showing: null },
      { question: "Which game features the Triforce?", answer: "The Legend of Zelda", showing: null },
      { question: "What is Mario’s brother’s name?", answer: "Luigi", showing: null },
      { question: "In Overwatch, who says 'Cheers, love! The cavalry’s here!'", answer: "Tracer", showing: null },
      { question: "What company developed Halo?", answer: "Bungie", showing: null }
    ]
  },
  {
    title: "Anime",
    clues: [
      { question: "Who is the creator of Dragon Ball?", answer: "Akira Toriyama", showing: null },
      { question: "What village is Naruto from?", answer: "Konoha", showing: null },
      { question: "Which anime features the Straw Hat Pirates?", answer: "One Piece", showing: null },
      { question: "Who is known as the 'Fullmetal Alchemist'?", answer: "Edward Elric", showing: null },
      { question: "What’s the name of the Titan-slaying weapon?", answer: "ODM Gear", showing: null }
    ]
  },
  {
    title: "Science",
    clues: [
      { question: "What planet is known as the Red Planet?", answer: "Mars", showing: null },
      { question: "What gas do plants absorb during photosynthesis?", answer: "Carbon Dioxide", showing: null },
      { question: "What is the chemical symbol for Gold?", answer: "Au", showing: null },
      { question: "What part of the cell contains genetic material?", answer: "Nucleus", showing: null },
      { question: "What is the speed of light?", answer: "299,792 km/s", showing: null }
    ]
  },
  {
    title: "Movies",
    clues: [
      { question: "Who directed 'Jurassic Park'?", answer: "Steven Spielberg", showing: null },
      { question: "What year was 'The Matrix' released?", answer: "1999", showing: null },
      { question: "Who played Jack in 'Titanic'?", answer: "Leonardo DiCaprio", showing: null },
      { question: "Which movie features the quote, 'Here's looking at you, kid'?", answer: "Casablanca", showing: null },
      { question: "Who voices Woody in Toy Story?", answer: "Tom Hanks", showing: null }
    ]
  },
  {
    title: "History",
    clues: [
      { question: "Who was the first President of the United States?", answer: "George Washington", showing: null },
      { question: "In what year did World War II end?", answer: "1945", showing: null },
      { question: "Which empire built the Colosseum?", answer: "The Roman Empire", showing: null },
      { question: "Who discovered America in 1492?", answer: "Christopher Columbus", showing: null },
      { question: "What wall fell in 1989?", answer: "The Berlin Wall", showing: null }
    ]
  },
  {
    title: "Math",
    clues: [
      { question: "What is the square root of 64?", answer: "8", showing: null },
      { question: "What is π (pi) rounded to 3 decimals?", answer: "3.142", showing: null },
      { question: "What is 12 x 12?", answer: "144", showing: null },
      { question: "What’s the value of 2³?", answer: "8", showing: null },
      { question: "What is the name of a six-sided polygon?", answer: "Hexagon", showing: null }
    ]
  }
];

/** Show banner */
function showBanner(message, type = "warning") {
  $("#banner")
    .removeClass()
    .addClass(`banner ${type}`)
    .text(message)
    .fadeIn();

  setTimeout(() => {
    $("#banner").fadeOut();
  }, 5000);
}

/** Try to fetch category IDs from Springboard API */
async function getCategoryIds() {
  try {
    const res = await axios.get(`https://projects.springboard.com/jeopardy/api/categories?count=10`);
    const catIds = res.data.map(result => result.id);
    return _.sampleSize(catIds, numOfCategories);
  } catch (err) {
    console.error("Springboard API failed at getCategoryIds:", err);
    return []; // empty means fallback mode
  }
}

/** Try to fetch a category with clues */
async function getCategory(catId) {
  try {
    const res = await axios.get(`https://projects.springboard.com/jeopardy/api/category?id=${catId}`);
    let allClues = res.data.clues;
    let randomClues = _.sampleSize(allClues, numOfClues);
    let clues = randomClues.map(clue => ({
      question: clue.question,
      answer: clue.answer,
      showing: null
    }));
    return { title: res.data.title, clues };
  } catch (err) {
    console.error("Springboard API failed at getCategory:", err);
    // pick one fallback category if the API fails
    return _.sample(fallbackCategories);
  }
}

/** Fill the Jeopardy board */
function fillTable() {
  $("#board").empty();

  const $thead = $("<thead>");
  const $headRow = $("<tr>");

  for (let x = 0; x < numOfCategories; x++) {
    $headRow.append($("<th>").text(categories[x].title));
  }

  $thead.append($headRow);
  $("#board").append($thead);

  const $tbody = $("<tbody>");
  for (let y = 0; y < numOfClues; y++) {
    const $tr = $("<tr>");
    for (let x = 0; x < numOfCategories; x++) {
      $tr.append($("<td>").attr("id", `${x}-${y}`).text("?"));
    }
    $tbody.append($tr);
  }

  $("#board").append($tbody);
}

/** Handle click on a clue cell */
function handleClick(evt) {
  let id = evt.target.id;
  let [catId, clueId] = id.split("-");
  let clue = categories[catId]?.clues[clueId];
  if (!clue) return;

  let text;
  if (clue.showing === null) {
    text = clue.question;
    clue.showing = "question";
    evt.target.style.color = "white";
  } else if (clue.showing === "question") {
    text = clue.answer;
    clue.showing = "answer";
    evt.target.style.backgroundColor = "#2a3698";
    evt.target.style.boxShadow = "1px 1px 10px rgb(16, 14, 59) inset";
  } else {
    return;
  }

  $(`#${catId}-${clueId}`).text(text);
}

/** Loading view */
function showLoadingView() {
  $("#loader").show(2000, hideLoadingView);
  $("#startGame").hide();
  $("#game").hide();
  $("#board").empty();
  setupAndStart();
}

/** Hide loader */
function hideLoadingView() {
  $("#loader").hide();
  $("#game").show();
  $("#startGame").show();
  $("#startGame").text("Reset Game");
}

/** Setup and start the game */
async function setupAndStart() {
  categories = [];

  try {
    let catIds = await getCategoryIds();

    if (catIds.length === 0) {
      // If Springboard failed completely, fallback to local data
      console.warn("Using fallback categories only.");
      categories = _.sampleSize(fallbackCategories, numOfCategories);
      showBanner("⚠️ Using fallback questions. API unavailable.");
    } else {
      for (let id of catIds) {
        categories.push(await getCategory(id));
      }
    }
  } catch (err) {
    console.error("Setup failed, using local fallback:", err);
    categories = _.sampleSize(fallbackCategories, numOfCategories);
    showBanner("⚠️ Using fallback questions due to setup failure.");
  }

  fillTable();
}

/** Initialize */
$(document).ready(function () {
  $("body").prepend('<div id="banner" class="banner" style="display:none;"></div>');
  $("#startGame").on("click", showLoadingView);
  $("#board").on("click", "td", handleClick);
});