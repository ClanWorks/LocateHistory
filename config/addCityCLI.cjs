// Import Firebase Admin SDK
const admin = require("firebase-admin");

// Import readline-sync for user input
const readline = require("readline-sync");

// Path to your Firebase service account key
const serviceAccount = require("./photolocation-54a1d-firebase-adminsdk-fbsvc-c654c3cd30.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Function to validate input
function validateInput(prompt, type) {
  let value;
  while (true) {
    value = readline.question(prompt);
    if (type === "string" && value.trim() !== "") {
      return value.trim();
    }
    if (type === "number" && !isNaN(Number(value))) {
      return Number(value);
    }
    console.log(`Invalid input. Please enter a valid ${type}.`);
  }
}

// Function to add a city with an auto-generated ID
async function addCity() {
  console.log("Enter details for the new city and picture:");

  const name = validateInput("City name: ", "string");
  const country = validateInput("Country: ", "string");
  const year = validateInput("Year (e.g., 1884): ", "number");
  const imageUrl = validateInput("Image URL: ", "string");
  const title = validateInput("Image title: ", "string");
  const fileSize = validateInput("File size (in MB): ", "number");
  const height = validateInput("Image height (in pixels): ", "number");
  const width = validateInput("Image width (in pixels): ", "number");
  const type = validateInput("Image type (e.g., jpeg, png): ", "string");

  const cityData = {
    name,
    country,
    year,
    image_url: imageUrl,
    title,
    file_size: fileSize,
    height,
    width,
    type,
  };

  try {
    // Add the city data with an auto-generated document ID
    const docRef = await db.collection("cities").add(cityData);
    console.log(`City "${name}" with picture added successfully! Document ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error adding city:", error);
  }
}

// Run the addCity function
addCity();

