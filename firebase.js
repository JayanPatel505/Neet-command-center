/* =========================================================
   NEET COMMAND CENTER — FIREBASE CLOUD + LIVE SHARING
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


/* =========================================================
   FIREBASE
========================================================= */

firebase.initializeApp(firebaseConfig);

const cloudAuth = firebase.auth();
const cloudDatabase = firebase.database();


/* =========================================================
   LOCAL STORAGE
========================================================= */

const NEET_STORAGE_KEY = "neet_command_center_v1";

const SHARE_ID_KEY =
    "neet_command_center_share_id";


/* =========================================================
   HELPERS
========================================================= */

function getLocalAppData() {

    try {

        const raw =
            localStorage.getItem(
                NEET_STORAGE_KEY
            );

        if (!raw) {
            return null;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "Could not read NEET data:",
            error
        );

        return null;

    }

}


function getShareId() {

    let shareId =
        localStorage.getItem(
            SHARE_ID_KEY
        );

    if (!shareId) {

        const randomPart =
            Math.random()
                .toString(36)
                .substring(2);

        const timePart =
            Date.now()
                .toString(36);

        shareId =
            randomPart +
            timePart;

        localStorage.setItem(
            SHARE_ID_KEY,
            shareId
        );

    }

    return shareId;

}


/* =========================================================
   DATE HELPERS
========================================================= */

function cloudTodayKey() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function cloudDaysRemaining(dateString) {

    if (!dateString) {
        return 0;
    }

    const target =
        new Date(
            dateString + "T00:00:00"
        );

    const today =
        new Date();

    today.setHours(
        0, 0, 0, 0
    );

    return Math.max(
        0,
        Math.ceil(
            (
                target - today
            ) /
            86400000
        )
    );

}


function cloudJourneyDay(startDate) {

    if (!startDate) {
        return 0;
    }

    const start =
        new Date(
            startDate + "T00:00:00"
        );

    const today =
        new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.max(
        1,
        Math.floor(
            (
                today - start
            ) /
            86400000
        ) + 1
    );

}


/* =========================================================
   PUBLIC PROGRESS BUILDER
========================================================= */

function buildPublicProgress() {

    const data =
        getLocalAppData();

    if (!data) {
        return null;
    }

    const today =
        cloudTodayKey();

    const todayData =
        data.days?.[today] || {};

    const tasks =
        Array.isArray(data.tasks)
            ? data.tasks
            : [];


    /*
       We intentionally DON'T upload
       the entire private appData object.
    */

    const publicTasks =
        tasks.map(task => ({

            id:
                task.id || "",

            name:
                task.name || "Untitled task",

            subject:
                task.subject || "other",

            questions:
                Number(
                    task.questions || 0
                ),

            completed:
                Boolean(
                    task.completed
                )

        }));


    const publicData = {

        appName:
            "NEET Command Center",

        ownerName:
            cloudAuth.currentUser?.displayName ||
            "NEET Aspirant",

        journeyDay:
            cloudJourneyDay(
                data.journeyStartDate
            ),

        neetDate:
            data.neetDate || null,

        daysRemaining:
            cloudDaysRemaining(
                data.neetDate
            ),

        streak:
            Number(
                data.bestStreak || 0
            ),

        bestStreak:
            Number(
                data.bestStreak || 0
            ),

        totalStudySeconds:
            Number(
                data.totalStudySeconds || 0
            ),

        today: {

            date:
                today,

            studySeconds:
                Number(
                    todayData.studySeconds ||
                    todayData.totalStudySeconds ||
                    0
                ),

            questions:
                Number(
                    todayData.questions ||
                    todayData.questionsSolved ||
                    0
                ),

            tasksDone:
                Array.isArray(
                    todayData.completedTasks
                )
                    ? todayData.completedTasks.length
                    : Number(
                        todayData.tasksDone || 0
                    )

        },

        tasks:
            publicTasks,

        updatedAt:
            firebase.database.ServerValue.TIMESTAMP

    };


    return publicData;

}


/* =========================================================
   CLOUD REFERENCES
========================================================= */

function getPublicRef() {

    const shareId =
        getShareId();

    return cloudDatabase
        .ref(
            "publicProgress/" +
            shareId
        );

}


/* =========================================================
   UPLOAD PROGRESS
========================================================= */

async function uploadProgress() {

    const user =
        cloudAuth.currentUser;

    if (!user) {

        console.log(
            "Cloud sync skipped: user not signed in."
        );

        return;

    }

    const progress =
        buildPublicProgress();

    if (!progress) {
        return;
    }

    /*
       Owner identity is stored in the document.

       Firebase rules will require this UID
       to match the authenticated user.
    */

    progress.ownerUid =
        user.uid;


    try {

        await getPublicRef()
            .set(progress);

        console.log(
            "NEET progress synced."
        );

        updateCloudButtons();

    } catch (error) {

        console.error(
            "Cloud sync failed:",
            error
        );

    }

}


/* =========================================================
   SHARE LINK
========================================================= */

function getShareLink() {

    const shareId =
        getShareId();

    return (
        window.location.origin +
        window.location.pathname
            .replace(
                /[^/]*$/,
                ""
            ) +
        "share.html?id=" +
        encodeURIComponent(
            shareId
        )
    );

}


/* =========================================================
   COPY SHARE LINK
========================================================= */

async function copyShareLink() {

    const user =
        cloudAuth.currentUser;

    if (!user) {

        alert(
            "Connect your Google account first."
        );

        return;

    }


    await uploadProgress();


    const link =
        getShareLink();


    try {

        await navigator.clipboard.writeText(
            link
        );

        alert(
            "Live progress link copied!\n\n" +
            link
        );

    } catch (error) {

        prompt(
            "Copy your live progress link:",
            link
        );

    }

}


/* =========================================================
   BUTTONS
========================================================= */

const cloudButton =
    document.createElement(
        "button"
    );

cloudButton.id =
    "cloudConnectButton";

cloudButton.textContent =
    "☁ Connect to cloud";


Object.assign(
    cloudButton.style,
    {

        position: "fixed",

        bottom: "18px",

        right: "18px",

        zIndex: "9999",

        border: "none",

        borderRadius: "999px",

        padding: "12px 16px",

        background: "#26352d",

        color: "#fffdf7",

        fontFamily: "inherit",

        fontWeight: "600",

        boxShadow:
            "0 8px 24px rgba(0,0,0,0.15)",

        cursor: "pointer"

    }
);


document.body.appendChild(
    cloudButton
);


/* SHARE BUTTON */

const shareButton =
    document.createElement(
        "button"
    );

shareButton.id =
    "cloudShareButton";

shareButton.textContent =
    "↗ Share live progress";


Object.assign(
    shareButton.style,
    {

        position: "fixed",

        bottom: "18px",

        left: "18px",

        zIndex: "9999",

        border: "none",

        borderRadius: "999px",

        padding: "12px 16px",

        background: "#789873",

        color: "white",

        fontFamily: "inherit",

        fontWeight: "600",

        boxShadow:
            "0 8px 24px rgba(0,0,0,0.15)",

        cursor: "pointer"

    }
);


shareButton.style.display =
    "none";


document.body.appendChild(
    shareButton
);


/* =========================================================
   GOOGLE LOGIN
========================================================= */

const googleProvider =
    new firebase.auth.GoogleAuthProvider();


cloudButton.addEventListener(
    "click",
    async () => {

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

    }
);


/* =========================================================
   SHARE BUTTON
========================================================= */

shareButton.addEventListener(
    "click",
    copyShareLink
);


/* =========================================================
   AUTH STATE
========================================================= */

cloudAuth.onAuthStateChanged(
    async user => {

        if (!user) {

            cloudButton.textContent =
                "☁ Connect to cloud";

            cloudButton.style.background =
                "#26352d";

            shareButton.style.display =
                "none";

            return;

        }


        console.log(
            "Firebase user signed in:",
            user.displayName
        );

        console.log(
            "Firebase UID:",
            user.uid
        );


        cloudButton.textContent =
            "☁ Cloud connected";

        cloudButton.style.background =
            "#789873";


        shareButton.style.display =
            "block";


        /*
           First upload after login.
        */

        await uploadProgress();

    }
);


/* =========================================================
   AUTOMATIC LOCAL → CLOUD SYNC
========================================================= */

const originalSetItem =
    Storage.prototype.setItem;


Storage.prototype.setItem =
    function(key, value) {

        originalSetItem.call(
            this,
            key,
            value
        );


        if (
            this === localStorage &&
            key === NEET_STORAGE_KEY
        ) {

            /*
               Wait until the current app
               finishes its local save.
            */

            clearTimeout(
                window.__neetCloudSyncTimer
            );


            window.__neetCloudSyncTimer =
                setTimeout(
                    () => {

                        if (
                            cloudAuth.currentUser
                        ) {

                            uploadProgress();

                        }

                    },
                    700
                );

        }

    };


console.log(
    "NEET Cloud sharing layer loaded."
);
