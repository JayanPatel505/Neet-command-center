/* =========================================================
   NEET COMMAND CENTER — FIREBASE CLOUD CONNECTION
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDnTEz6poGbiNetEm-Ug038mldh40gg7nY",
    authDomain: "neet-command-center.firebaseapp.com",
    databaseURL: "https://neet-command-center-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "neet-command-center",
    storageBucket: "neet-command-center.firebasestorage.app",
    messagingSenderId: "605033347371",
    appId: "1:605033347371:web:ef760a55c53a3ff56c6d6e",
    measurementId: "G-3CRR2YNVJ0"
};

firebase.initializeApp(firebaseConfig);

const cloudAuth = firebase.auth();
const cloudDatabase = firebase.database();

/* ---------------------------------------------------------
   OWNER LOGIN BUTTON
--------------------------------------------------------- */

const cloudButton = document.createElement("button");

cloudButton.textContent = "☁ Connect to cloud";
cloudButton.id = "cloudConnectButton";

cloudButton.style.position = "fixed";
cloudButton.style.bottom = "18px";
cloudButton.style.right = "18px";
cloudButton.style.zIndex = "9999";
cloudButton.style.border = "none";
cloudButton.style.borderRadius = "999px";
cloudButton.style.padding = "12px 16px";
cloudButton.style.background = "#26352d";
cloudButton.style.color = "#fffdf7";
cloudButton.style.fontFamily = "inherit";
cloudButton.style.fontWeight = "600";
cloudButton.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
cloudButton.style.cursor = "pointer";

document.body.appendChild(cloudButton);

/* ---------------------------------------------------------
   GOOGLE SIGN-IN
--------------------------------------------------------- */

const googleProvider =
    new firebase.auth.GoogleAuthProvider();

cloudButton.addEventListener("click", async () => {

    try {

        cloudButton.textContent =
            "Connecting...";

        await cloudAuth.signInWithPopup(
            googleProvider
        );

    } catch (error) {

        console.error(
            "Firebase login failed:",
            error
        );

        alert(
            "Cloud connection failed.\n\n" +
            error.message
        );

        cloudButton.textContent =
            "☁ Connect to cloud";

    }

});

/* ---------------------------------------------------------
   AUTH STATE
--------------------------------------------------------- */

cloudAuth.onAuthStateChanged(user => {

    if (!user) {

        cloudButton.textContent =
            "☁ Connect to cloud";

        return;

    }

    console.log(
        "Firebase user signed in:"
    );

    console.log(
        "Name:",
        user.displayName
    );

    console.log(
        "Email:",
        user.email
    );

    console.log(
        "UID:",
        user.uid
    );

    cloudButton.textContent =
        "☁ Cloud connected";

    cloudButton.style.background =
        "#789873";

    alert(
        "Cloud connected!\n\n" +
        "Your Firebase UID is:\n" +
        user.uid
    );

});
