/* =========================================================
   NEET COMMAND CENTER — LIVE PROGRESS SHARING
========================================================= */

const NEET_SHARE_KEY = "neet_share_id";


/* =========================================================
   CREATE PUBLIC COPY
========================================================= */

function createPublicProgress(data) {

    if (!data || typeof data !== "object") {
        return null;
    }

    /*
       Your actual appData structure is:

       journeyStartDate
       neetDate
       tasks
       days
       totalStudySeconds
       bestStreak
       timer
    */

    return {
        version: 1,

        updatedAt: Date.now(),

        journeyStartDate:
            data.journeyStartDate || null,

        neetDate:
            data.neetDate || null,

        tasks:
            Array.isArray(data.tasks)
                ? data.tasks
                : [],

        days:
            data.days || {},

        totalStudySeconds:
            Number(data.totalStudySeconds) || 0,

        bestStreak:
            Number(data.bestStreak) || 0
    };
}


/* =========================================================
   GENERATE SHARE ID
========================================================= */

function getShareId() {

    let shareId =
        localStorage.getItem(
            NEET_SHARE_KEY
        );

    if (!shareId) {

        shareId =
            crypto.randomUUID()
                .replaceAll("-", "");

        localStorage.setItem(
            NEET_SHARE_KEY,
            shareId
        );
    }

    return shareId;
}


/* =========================================================
   UPLOAD PROGRESS
========================================================= */

async function syncProgressToCloud(data) {

    if (
        typeof cloudAuth === "undefined" ||
        typeof cloudDatabase === "undefined"
    ) {
        return;
    }

    const user =
        cloudAuth.currentUser;

    if (!user) {
        return;
    }

    const progress =
        createPublicProgress(data);

    if (!progress) {
        return;
    }

    const shareId =
        getShareId();

    try {

        await cloudDatabase
            .ref(
                "shares/" +
                shareId
            )
            .set({

                ownerUid:
                    user.uid,

                progress:
                    progress

            });

        console.log(
            "☁️ NEET progress synced."
        );

    } catch (error) {

        console.error(
            "☁️ Cloud sync failed:",
            error
        );

    }
}


/* =========================================================
   CREATE SHARE LINK
========================================================= */

async function generateShareLink() {

    if (
        typeof cloudAuth === "undefined" ||
        !cloudAuth.currentUser
    ) {

        alert(
            "☁️ Connect your Google account first."
        );

        return;

    }

    const shareId =
        getShareId();

    try {

        await syncProgressToCloud(
            appData
        );

        const viewerUrl =
            new URL(
                "viewer.html",
                window.location.href
            );

        viewerUrl.searchParams.set(
            "id",
            shareId
        );

        const url =
            viewerUrl.toString();

        try {

            await navigator.clipboard.writeText(
                url
            );

            alert(
                "🔗 Read-only progress link copied!"
            );

        } catch {

            prompt(
                "Copy your read-only progress link:",
                url
            );

        }

        console.log(
            "🔗 Share link:",
            url
        );

    } catch (error) {

        console.error(
            "Could not create share link:",
            error
        );

        alert(
            "Couldn't create the share link."
        );

    }
}


/* =========================================================
   ADD SHARE BUTTON
========================================================= */

function addShareButton() {

    if (
        document.getElementById(
            "shareProgressButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.id =
        "shareProgressButton";

    button.type =
        "button";

    button.textContent =
        "🔗 Share Progress";

    button.style.cssText = `
        display: block;
        width: calc(100% - 32px);
        max-width: 500px;
        margin: 18px auto;
        padding: 14px 18px;
        border: 0;
        border-radius: 14px;
        background: #26352d;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    `;

    button.addEventListener(
        "click",
        generateShareLink
    );

    const app =
        document.querySelector(".app");

    if (app) {

        app.appendChild(button);

    }

}


/* =========================================================
   HOOK INTO YOUR EXISTING saveData()
========================================================= */

function setupCloudSync() {

    if (
        typeof saveData !== "function"
    ) {
        console.warn(
            "saveData() not found yet."
        );

        return;
    }

    const originalSaveData =
        saveData;

    window.saveData =
        function () {

            /*
               First do exactly what your
               existing app already does.
            */

            originalSaveData();

            /*
               Then quietly sync to Firebase
               if the owner is logged in.
            */

            if (
                typeof cloudAuth !== "undefined" &&
                cloudAuth.currentUser
            ) {

                syncProgressToCloud(
                    appData
                );

            }

        };

    addShareButton();

    console.log(
        "☁️ Live progress sharing enabled."
    );
}


/* =========================================================
   START
========================================================= */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            setupCloudSync,
            500
        );

    }
);
