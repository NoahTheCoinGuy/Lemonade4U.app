// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB2Jk7VZeDsUo7pOoCOns819Zu11VKR8BM",
  authDomain: "lemona-e616f.firebaseapp.com",
  projectId: "lemona-e616f",
  storageBucket: "lemona-e616f.firebasestorage.app",
  messagingSenderId: "339846497118",
  appId: "1:339846497118:web:869af5c81681f75b3805cf",
  measurementId: "G-X9KN053SHP"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const menuList = document.getElementById("menuList");

// Load menu items
db.collection("menu").onSnapshot(snapshot => {
  menuList.innerHTML = "";

  snapshot.forEach(doc => {
    const item = doc.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <ul>
        <li>
          <strong>${item.name}</strong><br>
          $${item.price}<br>
          <input type="radio" name="drink" value="${item.name}">
        </li>
      </ul>
    `;

    menuList.appendChild(div);
  });
});

// Submit order
async function submitOrder() {
  const selected = document.querySelector('input[name="drink"]:checked');

  if (!selected) {
    alert("Choose a drink first.");
    return;
  }

  await db.collection("orders").add({
    drink: selected.value,
    time: Date.now()
  });

  alert("Order sent!");
}
