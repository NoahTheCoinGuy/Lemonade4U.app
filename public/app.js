// 1. Firebase config (your real config)
const firebaseConfig = {
  apiKey: "AIzaSyB2Jk7VZeDsUo7pOoCOns819Zu11VKR8BM",
  authDomain: "lemona-e616f.firebaseapp.com",
  projectId: "lemona-e616f",
  storageBucket: "lemona-e616f.firebasestorage.app",
  messagingSenderId: "339846497118",
  appId: "1:339846497118:web:869af5c81681f75b3805cf",
  measurementId: "G-X9KN053SHP"
};

// 2. Initialize Firebase + Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Auto-login on index if ?user= is present
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const autoUser = params.get("user");

  const usernameInput = document.getElementById("username");
  if (autoUser && usernameInput) {
    usernameInput.value = autoUser;
    checkPoints();
  }

  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  }
};

function signUp() {
  window.location.href = "signup.html";
}


// 4. Sign-in page: check points
async function checkPoints() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");
  const rewardsDiv = document.getElementById("availableRewards");

  if (!user) {
    resultDiv.innerText = "Enter a username.";
    rewardsDiv.innerHTML = "";
    return;
  }

  const doc = await db.collection("users").doc(user).get();

  if (!doc.exists) {
    resultDiv.innerText = "User not found";
    rewardsDiv.innerHTML = "";
    return;
  }

  const data = doc.data();
  const points = data.points;

  // Header
  resultDiv.innerHTML = `
    <h2>${user} has:</h2>
    <h1>${points} points</h1>
  `;

  // Load rewards
  const snapshot = await db.collection("rewards").get();
  let available = [];

  snapshot.forEach(rewardDoc => {
    const reward = rewardDoc.data();
    if (points >= reward.cost) {
      available.push(`${reward.name} (${reward.cost} pts)`);
    }
  });

  // Show available rewards
  if (available.length === 0) {
    rewardsDiv.innerHTML = "<p>No rewards available.</p>";
  } else {
    rewardsDiv.innerHTML = `
      <h3>Available Rewards:</h3>
      <ul>${available.map(r => `<li>${r}</li>`).join("")}</ul>
    `;
  }
}


// 6. Create account + auto-login
async function createAccount() {
  const user = document.getElementById("newUser").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");

  if (!user) {
    resultDiv.innerText = "Choose a username.";
    return;
  }

  const docRef = db.collection("users").doc(user);
  const existing = await docRef.get();

  if (existing.exists) {
    resultDiv.innerText = "Username already exists.";
    return;
  }

  await docRef.set({ points: 0 });

  // Auto-login: go back to index with ?user=
  window.location.href = `index.html?user=${encodeURIComponent(user)}`;
}

// 7. Admin login (passcode stored in Firestore: config/admin.passcode)
async function adminLogin() {
  const passcodeInput = document.getElementById("passcode");
  const panel = document.getElementById("adminPanel");

  const entered = passcodeInput.value.trim();

  const configDoc = await db.collection("config").doc("admin").get();
  if (!configDoc.exists) {
    alert("Admin config not found in Firestore.");
    return;
  }

  const { passcode } = configDoc.data();

  if (entered === passcode) {
    panel.style.display = "block";
    loadRewards();
  } else {
    alert("Incorrect passcode");
  }
}

// 8. Load rewards into dropdown (collection: rewards)
async function loadRewards() {
  const dropdown = document.getElementById("rewardDropdown");
  dropdown.innerHTML = "";

  const snapshot = await db.collection("rewards").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id; // use doc id
    option.textContent = `${data.name} (${data.cost} pts)`;
    dropdown.appendChild(option);
  });
}

// 9. Add points
async function addPoints() {
  const user = document.getElementById("adminUser").value.trim().toLowerCase();
  const amount = Number(document.getElementById("addAmount").value);

  if (!user || isNaN(amount) || amount <= 0) {
    alert("Enter username and positive amount.");
    return;
  }

  const docRef = db.collection("users").doc(user);
  const doc = await docRef.get();
  const current = doc.exists ? doc.data().points : 0;

  await docRef.set({ points: current + amount }, { merge: true });

  alert("Points added");
}

// 10. Remove points
async function removePoints() {
  const user = document.getElementById("adminUser").value.trim().toLowerCase();
  const amount = Number(document.getElementById("removeAmount").value);

  if (!user || isNaN(amount) || amount <= 0) {
    alert("Enter username and positive amount.");
    return;
  }

  const docRef = db.collection("users").doc(user);
  const doc = await docRef.get();
  const current = doc.exists ? doc.data().points : 0;

  const newPoints = Math.max(0, current - amount);
  await docRef.set({ points: newPoints }, { merge: true });

  alert("Points removed");
}

// 11. Redeem reward (subtract cost)
async function redeemReward() {
  const user = document.getElementById("adminUser").value.trim().toLowerCase();
  const rewardId = document.getElementById("rewardDropdown").value;

  if (!user || !rewardId) {
    alert("Enter username and select a reward.");
    return;
  }

  const userRef = db.collection("users").doc(user);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    alert("User not found.");
    return;
  }

  const rewardDoc = await db.collection("rewards").doc(rewardId).get();
  if (!rewardDoc.exists) {
    alert("Reward not found.");
    return;
  }

  const userData = userDoc.data();
  const rewardData = rewardDoc.data();

  const newPoints = Math.max(0, (userData.points || 0) - rewardData.cost);
  await userRef.set({ points: newPoints }, { merge: true });

  alert(`Reward "${rewardData.name}" redeemed`);
}
