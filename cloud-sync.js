/* =========================================================
   NEET COMMAND CENTER — CLOUD SYNC
   Read-only sharing system
========================================================= */

const NEET_CLOUD_VERSION = 1;

/*
   Creates a clean copy of the progress data.

   We intentionally don't upload things like:
   - Firebase login details
   - private account information
   - browser/localStorage internals
*/
function createPublicProgress(data) {

    if (!data || typeof data !== "object") {
        return null;
    }

    return {
        version: NEET_CLOUD_VERSION,

        updatedAt: Date.now(),

        journeyDay: data.journeyDay ?? 0,

        streak: data.streak ?? 0,

        bestStreak: data.bestStreak ?? 0,

        studiedToday: data.studiedToday ?? 0,

        totalStudyTime: data.totalStudyTime ?? 0,

        totalTasks: data.totalTasks ?? 0,

        totalQuestions: data.totalQuestions ?? 0,

        tasks: data.tasks ?? [],

        sessions: data.sessions ?? [],

        history: data.history ?? {},

        subjects: data.subjects ?? {},

        settings: {
            neetDate: data.settings?.neetDate ?? null
        }
    };
}


/* ---------------------------------------------------------
   UPLOAD CURRENT PROGRESS
--------------------------------------------------------- */

async function uploadProgressToCloud(data) {

    if (!cloudAuth || !cloudDatabase) {
        console.warn("Firebase is not available.");
        return;
    }

    const user = cloudAuth.currentUser;

    if (!user) {
        console.log("Not logged into Firebase.");
        return;
    }

    const publicProgress = createPublicProgress(data);

    if (!publicProgress) {
        console.warn("No progress data to upload.");
        return;
    }

    try {

        await cloudDatabase
            .ref("users/" + user.uid + "/progress")
            .set(publicProgress);

        console.log("☁️ Progress uploaded.");

    } catch (error) {

        console.error(
            "Cloud upload failed:",
            error
        );

    }
}


/* ---------------------------------------------------------
   CREATE / UPDATE SHARE
--------------------------------------------------------- */

async function createShareLink(data) {

    if (!cloudAuth || !cloudDatabase) {
        alert("Firebase is not available.");
        return null;
    }

    const user = cloudAuth.currentUser;

    if (!user) {
        alert("Connect your Google account first.");
        return null;
    }

    try {

        let shareId =
            localStorage.getItem("neet_share_id");

        if (!shareId) {

            shareId =
                crypto.randomUUID()
                    .replaceAll("-", "");

            localStorage.setItem(
                "neet_share_id",
                shareId
            );
        }

        const publicProgress =
            createPublicProgress(data);

        await cloudDatabase
            .ref("shares/" + shareId)
            .set({

                ownerUid: user.uid,

                progress: publicProgress

            });

        const shareUrl =
            window.location.origin +
            window.location.pathname.replace(
                "index.html",
                "viewer.html"
            ) +
            "?id=" +
            shareId;

        return shareUrl;

    } catch (error) {

        console.error(
            "Share creation failed:",
            error
        );

        alert(
            "Couldn't create the share link."
        );

        return null;
    }
}


/* ---------------------------------------------------------
   COPY SHARE LINK
--------------------------------------------------------- */

async function copyShareLink(data) {

    const url =
        await createShareLink(data);

    if (!url) {
        return;
    }

    try {

        await navigator.clipboard.writeText(url);

        alert(
            "🔗 Read-only progress link copied!"
        );

        console.log(
            "Share link:",
            url
        );

    } catch (error) {

        prompt(
            "Copy your read-only progress link:",
            url
        );
    }
}
