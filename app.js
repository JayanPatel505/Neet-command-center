/* =========================================================
   NEET COMMAND CENTER
   COMPLETE V1 JAVASCRIPT
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "neet_command_center_v1";

const DEFAULT_DATA = {
    journeyStartDate: null,
    neetDate: "2027-05-02",

    tasks: [],

    days: {},

    totalStudySeconds: 0,

    bestStreak: 0,

    timer: {
        mode: "pomodoro",
        selectedMinutes: 25
    }
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   APP DATA
========================================================= */

let appData = loadData();

let editingTaskId = null;

let currentRange = "day";

let timerInterval = null;

let timerRunning = false;

let currentMode = "pomodoro";

let selectedMinutes = 25;

let remainingSeconds = 25 * 60;

let elapsedSeconds = 0;

let sessionStudiedSeconds = 0;

let lastTimestamp = null;


/* =========================================================
   TODAY
========================================================= */

function getTodayKey() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const day =
        String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDateFromKey(key) {

    const parts = key.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}


function getTodayData() {

    const today = getTodayKey();

    if (!appData.days[today]) {

        appData.days[today] = {
            studySeconds: 0,
            sessions: [],
            tasksCompleted: 0,
            questionsSolved: 0,
            subjects: {
                physics: {
                    tasks: 0,
                    questions: 0
                },
                chemistry: {
                    tasks: 0,
                    questions: 0
                },
                biology: {
                    tasks: 0,
                    questions: 0
                }
            }
        };

    }

    return appData.days[today];
}


/* =========================================================
   DATA NORMALIZATION
========================================================= */

function normalizeData(data) {

    const merged = {
        ...DEFAULT_DATA,
        ...data
    };

    merged.tasks =
        Array.isArray(data.tasks)
            ? data.tasks
            : [];

    merged.days =
        data.days && typeof data.days === "object"
            ? data.days
            : {};

    merged.timer = {
        ...DEFAULT_DATA.timer,
        ...(data.timer || {})
    };

    if (
        typeof merged.totalStudySeconds !== "number"
    ) {
        merged.totalStudySeconds = 0;
    }

    if (
        typeof merged.bestStreak !== "number"
    ) {
        merged.bestStreak = 0;
    }

    return merged;
}


/* =========================================================
   LOAD / SAVE
========================================================= */

function loadData() {

    try {

        const raw =
            localStorage.getItem(STORAGE_KEY);

        if (!raw) {

            const fresh =
                JSON.parse(JSON.stringify(DEFAULT_DATA));

            fresh.journeyStartDate =
                getTodayKey();

            return fresh;

        }

        const parsed = JSON.parse(raw);

        return normalizeData(parsed);

    } catch (error) {

        console.error(
            "Could not load app data:",
            error
        );

        const fresh =
            JSON.parse(JSON.stringify(DEFAULT_DATA));

        fresh.journeyStartDate =
            getTodayKey();

        return fresh;

    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );

}


/* =========================================================
   DATE / NUMBER FORMATTING
========================================================= */

function formatDate(date) {

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


function formatShortDate(date) {

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
    );

}


function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString();

}


function formatDuration(seconds) {

    seconds = Math.max(
        0,
        Math.floor(seconds)
    );

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    if (hours > 0) {

        return `${hours}h ${minutes}m`;

    }

    return `${minutes}m`;

}


function formatTimer(seconds) {

    seconds = Math.max(
        0,
        Math.floor(seconds)
    );

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    const secs =
        seconds % 60;

    if (hours > 0) {

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");

    }

    return [
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
    ].join(":");

}


/* =========================================================
   INITIAL APP SETUP
========================================================= */

function initializeApp() {

    getTodayData();

    saveData();

    updateHeader();

    renderTasks();

    updateDashboard();

    updateTotals();

    updateHistory();

    setupTimer();

    drawAllCharts();

}


/* =========================================================
   HEADER
========================================================= */

function updateHeader() {

    const now = new Date();

    const hour = now.getHours();

    let greeting = "Good morning.";

    if (hour >= 12 && hour < 18) {

        greeting = "Good afternoon.";

    }

    if (hour >= 18) {

        greeting = "Good evening.";

    }

    $("greeting").textContent =
        greeting;

    $("currentDate").textContent =
        formatDate(now);


    if (!appData.journeyStartDate) {

        appData.journeyStartDate =
            getTodayKey();

        saveData();

    }


    const start =
        getDateFromKey(
            appData.journeyStartDate
        );

    const today =
        new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diff =
        Math.floor(
            (today - start) /
            86400000
        );

    const journeyDay =
        Math.max(1, diff + 1);

    $("journeyDay").textContent =
        String(journeyDay).padStart(2, "0");


    const neetDate =
        getDateFromKey(
            appData.neetDate
        );

    neetDate.setHours(0, 0, 0, 0);

    const remaining =
        Math.max(
            0,
            Math.ceil(
                (neetDate - today) /
                86400000
            )
        );

    $("daysRemaining").textContent =
        remaining;

}


/* =========================================================
   STREAK
========================================================= */

function getStudyDates() {

    return Object.keys(appData.days)

        .filter(
            key =>
                appData.days[key] &&
                appData.days[key].studySeconds > 0
        )

        .sort();

}


function calculateCurrentStreak() {

    const dates =
        getStudyDates();

    if (!dates.length) {

        return 0;

    }

    const today =
        getTodayKey();

    const todayDate =
        getDateFromKey(today);

    let streak = 0;

    let cursor =
        new Date(todayDate);

    const todayStudied =
        appData.days[today] &&
        appData.days[today].studySeconds > 0;

    if (!todayStudied) {

        cursor.setDate(
            cursor.getDate() - 1
        );

    }

    while (true) {

        const key =
            [
                cursor.getFullYear(),
                String(
                    cursor.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    cursor.getDate()
                ).padStart(2, "0")
            ].join("-");

        const day =
            appData.days[key];

        if (
            !day ||
            day.studySeconds <= 0
        ) {

            break;

        }

        streak++;

        cursor.setDate(
            cursor.getDate() - 1
        );

    }

    return streak;

}


function calculateBestStreak() {

    const dates =
        getStudyDates();

    if (!dates.length) {

        return 0;

    }

    let best = 1;

    let current = 1;

    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const previous =
            getDateFromKey(
                dates[i - 1]
            );

        const currentDate =
            getDateFromKey(
                dates[i]
            );

        const difference =
            Math.round(
                (
                    currentDate -
                    previous
                ) / 86400000
            );

        if (difference === 1) {

            current++;

            best =
                Math.max(
                    best,
                    current
                );

        } else {

            current = 1;

        }

    }

    return best;

}


function updateStreak() {

    const current =
        calculateCurrentStreak();

    const best =
        calculateBestStreak();

    appData.bestStreak =
        Math.max(
            appData.bestStreak || 0,
            best
        );

    $("dayStreak").textContent =
        current;

    $("heroStreak").textContent =
        current;

    $("bestStreak").textContent =
        appData.bestStreak;

    saveData();

}


/* =========================================================
   TASK CREATION
========================================================= */

function createTask(
    name,
    subject,
    questions
) {

    const task = {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .slice(2),

        name: name.trim(),

        subject,

        plannedQuestions:
            Math.max(
                0,
                Number(questions) || 0
            ),

        completedQuestions: 0,

        completed: false,

        createdAt:
            new Date().toISOString(),

        completedAt: null

    };

    appData.tasks.push(task);

    saveData();

    renderTasks();

    updateDashboard();

    updateTotals();

    drawAllCharts();

}


/* =========================================================
   TASK RENDERING
========================================================= */

function renderTasks() {

    const subjects = [
        "physics",
        "chemistry",
        "biology"
    ];

    subjects.forEach(subject => {

        const list =
            $(`${subject}Tasks`);

        const empty =
            $(`${subject}Empty`);

        list.innerHTML = "";

        const tasks =
            appData.tasks.filter(
                task =>
                    task.subject === subject
            );

        empty.hidden =
            tasks.length > 0;

        tasks.forEach(task => {

            const item =
                document.createElement("div");

            item.className =
                "task-item" +
                (
                    task.completed
                        ? " completed"
                        : ""
                );

            item.dataset.taskId =
                task.id;


            const toggle =
                document.createElement("button");

            toggle.className =
                "task-toggle";

            toggle.type =
                "button";

            toggle.setAttribute(
                "aria-label",
                task.completed
                    ? "Mark task incomplete"
                    : "Complete task"
            );

            if (task.completed) {

                toggle.classList.add(
                    "completed"
                );

            }


            const check =
                document.createElement("span");

            check.className =
                "task-check";

            check.textContent =
                "✓";

            toggle.appendChild(check);


            toggle.addEventListener(
                "click",
                () => {

                    toggleTask(
                        task.id
                    );

                }
            );


            const content =
                document.createElement("div");

            content.className =
                "task-content";


            const name =
                document.createElement("span");

            name.className =
                "task-name";

            name.textContent =
                task.name;


            const meta =
                document.createElement("div");

            meta.className =
                "task-meta";


            const questionText =
                task.plannedQuestions > 0
                    ? `${task.completedQuestions || 0}/${task.plannedQuestions} questions`
                    : "No questions set";


            meta.innerHTML =
                `<span>${questionText}</span>`;


            content.appendChild(name);

            content.appendChild(meta);


            const actions =
                document.createElement("div");

            actions.className =
                "task-actions";


            const edit =
                document.createElement("button");

            edit.className =
                "task-action";

            edit.type =
                "button";

            edit.textContent =
                "✎";

            edit.setAttribute(
                "aria-label",
                "Edit task"
            );

            edit.addEventListener(
                "click",
                () => {

                    openTaskModal(
                        task.id
                    );

                }
            );


            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "task-action delete";

            deleteButton.type =
                "button";

            deleteButton.textContent =
                "×";

            deleteButton.setAttribute(
                "aria-label",
                "Delete task"
            );

            deleteButton.addEventListener(
                "click",
                () => {

                    deleteTask(
                        task.id
                    );

                }
            );


            actions.appendChild(edit);

            actions.appendChild(
                deleteButton
            );


            item.appendChild(toggle);

            item.appendChild(content);

            item.appendChild(actions);

            list.appendChild(item);

        });

    });


    updateSubjectSummaries();

}


/* =========================================================
   TASK TOGGLE
========================================================= */

function toggleTask(taskId) {

    const task =
        appData.tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {

        return;

    }


    task.completed =
        !task.completed;


    if (task.completed) {

        task.completedAt =
            new Date().toISOString();

    } else {

        task.completedAt =
            null;

    }


    saveData();

    renderTasks();

    updateDashboard();

    updateTotals();

    drawAllCharts();

}


/* =========================================================
   TASK DELETE
========================================================= */

function deleteTask(taskId) {

    const task =
        appData.tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${task.name}"?`
        );

    if (!confirmed) {

        return;

    }


    appData.tasks =
        appData.tasks.filter(
            item =>
                item.id !== taskId
        );


    saveData();

    renderTasks();

    updateDashboard();

    updateTotals();

    drawAllCharts();

}


/* =========================================================
   TASK MODAL
========================================================= */

function openTaskModal(taskId = null) {

    editingTaskId =
        taskId;

    $("taskModal").hidden =
        false;

    document.body.style.overflow =
        "hidden";


    if (taskId) {

        const task =
            appData.tasks.find(
                item =>
                    item.id === taskId
            );

        if (!task) {

            return;

        }

        $("taskModalTitle").textContent =
            "Edit task";

        $("saveTaskButton").textContent =
            "Save changes";

        $("taskName").value =
            task.name;

        $("taskSubject").value =
            task.subject;

        $("taskQuestions").value =
            task.plannedQuestions;

    } else {

        $("taskModalTitle").textContent =
            "Add task";

        $("saveTaskButton").textContent =
            "Add task";

        $("taskName").value =
            "";

        $("taskSubject").value =
            "physics";

        $("taskQuestions").value =
            "0";

    }


    setTimeout(
        () =>
            $("taskName").focus(),
        50
    );

}


function closeTaskModal() {

    $("taskModal").hidden =
        true;

    document.body.style.overflow =
        "";

    editingTaskId =
        null;

}


function saveTaskFromModal() {

    const name =
        $("taskName").value.trim();

    const subject =
        $("taskSubject").value;

    const questions =
        Math.max(
            0,
            Number(
                $("taskQuestions").value
            ) || 0
        );


    if (!name) {

        $("taskName").focus();

        return;

    }


    if (editingTaskId) {

        const task =
            appData.tasks.find(
                item =>
                    item.id === editingTaskId
            );

        if (task) {

            task.name =
                name;

            task.subject =
                subject;

            task.plannedQuestions =
                questions;

            task.completedQuestions =
                Math.min(
                    task.completedQuestions || 0,
                    questions
                );

        }

    } else {

        createTask(
            name,
            subject,
            questions
        );

    }


    saveData();

    closeTaskModal();

    renderTasks();

    updateDashboard();

    updateTotals();

    drawAllCharts();

}


/* =========================================================
   QUESTION UPDATE
========================================================= */

function updateTaskQuestions(
    taskId,
    amount
) {

    const task =
        appData.tasks.find(
            item =>
                item.id === taskId
        );

    if (!task) {

        return;

    }


    task.completedQuestions =
        Math.max(
            0,
            Math.min(
                Number(amount) || 0,
                task.plannedQuestions
            )
        );


    saveData();

    renderTasks();

    updateDashboard();

    updateTotals();

    drawAllCharts();

}


/* =========================================================
   SUBJECT SUMMARIES
========================================================= */

function getSubjectStats(
    subject
) {

    const tasks =
        appData.tasks.filter(
            task =>
                task.subject === subject
        );


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const questions =
        tasks.reduce(
            (sum, task) =>
                sum +
                Number(
                    task.completedQuestions || 0
                ),
            0
        );


    return {
        total: tasks.length,
        completed,
        questions
    };

}


function updateSubjectSummaries() {

    const subjects = [
        "physics",
        "chemistry",
        "biology"
    ];


    subjects.forEach(subject => {

        const stats =
            getSubjectStats(
                subject
            );


        $(`${subject}Progress`)
            .textContent =
            `${stats.completed} / ${stats.total}`;


        $(`${subject}Summary`)
            .textContent =
            `${stats.total} tasks · ${formatNumber(stats.questions)} questions`;

    });

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const today =
        getTodayData();


    const completedTasks =
        appData.tasks.filter(
            task =>
                task.completed &&
                task.completedAt &&
                task.completedAt.slice(0, 10) ===
                getTodayKey()
        );


    /*
       If an old task was completed on another day,
       it doesn't count toward today's task counter.
    */

    let todayTasks = 0;

    let todayQuestions = 0;


    appData.tasks.forEach(task => {

        if (
            task.completed &&
            task.completedAt &&
            task.completedAt.slice(0, 10) ===
            getTodayKey()
        ) {

            todayTasks++;

        }

    });


    /*
       Questions are counted from today's
       question entries in today's data.
    */

    todayQuestions =
        today.questionsSolved || 0;


    today.tasksCompleted =
        todayTasks;


    today.subjects = {
        physics: {
            tasks: 0,
            questions: 0
        },
        chemistry: {
            tasks: 0,
            questions: 0
        },
        biology: {
            tasks: 0,
            questions: 0
        }
    };


    completedTasks.forEach(task => {

        if (
            today.subjects[task.subject]
        ) {

            today.subjects[
                task.subject
            ].tasks++;

        }

    });


    /*
       Recalculate question totals
       from today's task activity.
    */

    todayQuestions = 0;


    completedTasks.forEach(task => {

        const questions =
            Number(
                task.completedQuestions || 0
            );

        todayQuestions +=
            questions;

        if (
            today.subjects[task.subject]
        ) {

            today.subjects[
                task.subject
            ].questions +=
                questions;

        }

    });


    today.questionsSolved =
        todayQuestions;


    const totalTasks =
        appData.tasks.length;


    const completedTotal =
        appData.tasks.filter(
            task =>
                task.completed
        ).length;


    const percentage =
        totalTasks > 0
            ? Math.round(
                completedTotal /
                totalTasks *
                100
            )
            : 0;


    $("planProgress").textContent =
        `${percentage}%`;


    $("tasksDone").textContent =
        todayTasks;


    $("overviewTasks").textContent =
        todayTasks;


    $("overviewQuestions").textContent =
        formatNumber(
            todayQuestions
        );


    $("overviewTime").textContent =
        formatDuration(
            today.studySeconds
        );


    $("studiedToday").textContent =
        formatDuration(
            today.studySeconds
        );


    updateStreak();

    saveData();

}


/* =========================================================
   STUDY SESSION RECORDING
========================================================= */

function recordStudySession(
    seconds,
    mode
) {

    seconds =
        Math.floor(seconds);


    if (seconds <= 0) {

        return;

    }


    const today =
        getTodayData();


    today.studySeconds +=
        seconds;


    appData.totalStudySeconds +=
        seconds;


    today.sessions.push({

        id:
            Date.now().toString(),

        seconds,

        mode,

        timestamp:
            new Date().toISOString()

    });


    saveData();

    updateDashboard();

    updateTotals();

    updateHistory();

    drawAllCharts();

}


/* =========================================================
   HISTORY
========================================================= */

function updateHistory() {

    const today =
        getTodayData();

    const sessions =
        today.sessions || [];


    $("sessionCount").textContent =
        sessions.length;


    const list =
        $("sessionList");

    list.innerHTML = "";


    $("sessionEmpty").hidden =
        sessions.length > 0;


    [...sessions]
        .reverse()
        .forEach(session => {

            const item =
                document.createElement("div");

            item.className =
                "session-item";


            const info =
                document.createElement("div");

            info.className =
                "session-info";


            const title =
                document.createElement("strong");

            title.textContent =
                getSessionTitle(
                    session.mode
                );


            const time =
                document.createElement("small");

            time.textContent =
                new Date(
                    session.timestamp
                ).toLocaleTimeString(
                    undefined,
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );


            info.appendChild(title);

            info.appendChild(time);


            const duration =
                document.createElement("span");

            duration.className =
                "session-duration";

            duration.textContent =
                formatDuration(
                    session.seconds
                );


            item.appendChild(info);

            item.appendChild(duration);

            list.appendChild(item);

        });

}


function getSessionTitle(mode) {

    if (mode === "pomodoro") {

        return "Pomodoro session";

    }

    if (mode === "manual") {

        return "Manual session";

    }

    return "Stopwatch session";

}


/* =========================================================
   TOTALS
========================================================= */

function updateTotals() {

    let completedTasks = 0;

    let completedQuestions = 0;


    appData.tasks.forEach(task => {

        if (task.completed) {

            completedTasks++;

        }

        completedQuestions +=
            Number(
                task.completedQuestions || 0
            );

    });


    $("totalStudyTime").textContent =
        formatDuration(
            appData.totalStudySeconds
        );


    $("totalTasks").textContent =
        completedTasks;


    $("totalQuestions").textContent =
        formatNumber(
            completedQuestions
        );


    $("bestStreak").textContent =
        appData.bestStreak || 0;

}


/* =========================================================
   TIMER SETUP
========================================================= */

function setupTimer() {

    currentMode =
        appData.timer.mode ||
        "pomodoro";

    selectedMinutes =
        Number(
            appData.timer.selectedMinutes
        ) || 25;


    updateTimerModeButtons();

    updateTimerOptions();

    setInitialTimer();

}


/* =========================================================
   TIMER INITIAL VALUE
========================================================= */

function setInitialTimer() {

    stopTimerInterval();

    timerRunning = false;

    sessionStudiedSeconds = 0;

    elapsedSeconds = 0;

    lastTimestamp = null;


    if (currentMode === "stopwatch") {

        remainingSeconds = 0;

        $("timerStatus").textContent =
            "Ready";

    } else {

        if (currentMode === "manual") {

            remainingSeconds =
                getManualSeconds();

        } else {

            remainingSeconds =
                selectedMinutes * 60;

        }

        $("timerStatus").textContent =
            "Ready";

    }


    updateTimerDisplay();

    updateTimerButton();

}


/* =========================================================
   TIMER MODE
========================================================= */

function updateTimerModeButtons() {

    $$(".mode-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.mode ===
                currentMode
            );

        });


    $("pomodoroOptions").hidden =
        currentMode !== "pomodoro";


    $("manualOptions").hidden =
        currentMode !== "manual";

}


/* =========================================================
   TIMER OPTIONS
========================================================= */

function updateTimerOptions() {

    $$(".preset-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(
                    button.dataset.minutes
                ) === selectedMinutes
            );

        });

}


/* =========================================================
   TIMER MODE CHANGE
========================================================= */

function changeTimerMode(mode) {

    if (timerRunning) {

        return;

    }


    currentMode =
        mode;


    appData.timer.mode =
        mode;

    saveData();


    updateTimerModeButtons();

    setInitialTimer();

}


/* =========================================================
   POMODORO PRESET
========================================================= */

function selectPomodoro(minutes) {

    if (timerRunning) {

        return;

    }


    selectedMinutes =
        Number(minutes);


    appData.timer.selectedMinutes =
        selectedMinutes;

    saveData();


    updateTimerOptions();

    setInitialTimer();

}


/* =========================================================
   MANUAL TIME
========================================================= */

function getManualSeconds() {

    const hours =
        Math.max(
            0,
            Number(
                $("manualHours").value
            ) || 0
        );


    const minutes =
        Math.max(
            0,
            Number(
                $("manualMinutes").value
            ) || 0
        );


    return (
        hours * 3600 +
        minutes * 60
    );

}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function updateTimerDisplay() {

    if (
        currentMode ===
        "stopwatch"
    ) {

        $("timerDisplay").textContent =
            formatTimer(
                elapsedSeconds
            );

    } else {

        $("timerDisplay").textContent =
            formatTimer(
                remainingSeconds
            );

    }

}


/* =========================================================
   TIMER BUTTON
========================================================= */

function updateTimerButton() {

    if (timerRunning) {

        $("timerMainButton").textContent =
            "⏸ Pause";

        return;

    }


    if (
        currentMode !== "stopwatch" &&
        remainingSeconds <= 0
    ) {

        $("timerMainButton").textContent =
            "↻ Restart";

        return;

    }


    if (
        currentMode === "stopwatch" &&
        elapsedSeconds > 0
    ) {

        $("timerMainButton").textContent =
            "▶ Resume";

        return;

    }


    if (
        currentMode !== "stopwatch" &&
        sessionStudiedSeconds > 0
    ) {

        $("timerMainButton").textContent =
            "▶ Resume";

        return;

    }


    $("timerMainButton").textContent =
        "▶ Start";

}


/* =========================================================
   TIMER START
========================================================= */

function startTimer() {

    if (timerRunning) {

        return;

    }


    if (
        currentMode !== "stopwatch" &&
        remainingSeconds <= 0
    ) {

        if (currentMode === "manual") {

            remainingSeconds =
                getManualSeconds();

        } else {

            remainingSeconds =
                selectedMinutes * 60;

        }

    }


    if (
        currentMode !== "stopwatch" &&
        remainingSeconds <= 0
    ) {

        return;

    }


    timerRunning = true;

    lastTimestamp =
        performance.now();


    $("timerStatus").textContent =
        "Focusing";


    updateTimerButton();


    timerInterval =
        setInterval(
            updateTimer,
            250
        );

}


/* =========================================================
   TIMER UPDATE
========================================================= */

function updateTimer() {

    const now =
        performance.now();


    const delta =
        (now - lastTimestamp) / 1000;


    lastTimestamp =
        now;


    if (currentMode === "stopwatch") {

        elapsedSeconds +=
            delta;

        sessionStudiedSeconds +=
            delta;

    } else {

        remainingSeconds -=
            delta;

        sessionStudiedSeconds +=
            delta;


        if (remainingSeconds <= 0) {

            remainingSeconds = 0;

            finishTimer();

            return;

        }

    }


    updateTimerDisplay();

}


/* =========================================================
   TIMER PAUSE
========================================================= */

function pauseTimer() {

    if (!timerRunning) {

        return;

    }


    stopTimerInterval();

    timerRunning = false;


    $("timerStatus").textContent =
        "Paused";


    updateTimerButton();

}


/* =========================================================
   TIMER FINISH
========================================================= */

function finishTimer() {

    stopTimerInterval();

    timerRunning = false;


    const studied =
        Math.floor(
            sessionStudiedSeconds
        );


    if (studied > 0) {

        recordStudySession(
            studied,
            currentMode
        );

    }


    sessionStudiedSeconds = 0;

    $("timerStatus").textContent =
        "Complete";


    if (
        currentMode === "stopwatch"
    ) {

        elapsedSeconds = 0;

    }


    updateTimerDisplay();

    updateTimerButton();

}


/* =========================================================
   TIMER RESET
========================================================= */

function resetTimer() {

    if (timerRunning) {

        stopTimerInterval();

        timerRunning = false;

    }


    /*
       If the user reset a partially completed
       session, preserve the actual time studied.
    */

    const studied =
        Math.floor(
            sessionStudiedSeconds
        );


    if (studied > 0) {

        recordStudySession(
            studied,
            currentMode
        );

    }


    sessionStudiedSeconds = 0;

    elapsedSeconds = 0;

    setInitialTimer();

}


/* =========================================================
   STOP TIMER INTERVAL
========================================================= */

function stopTimerInterval() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


/* =========================================================
   TIMER EVENTS
========================================================= */

$("timerMainButton")
    .addEventListener(
        "click",
        () => {

            if (timerRunning) {

                pauseTimer();

            } else {

                startTimer();

            }

        }
    );


$("timerResetButton")
    .addEventListener(
        "click",
        resetTimer
    );


$$(".mode-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                changeTimerMode(
                    button.dataset.mode
                );

            }
        );

    });


$$(".preset-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectPomodoro(
                    button.dataset.minutes
                );

            }
        );

    });


$("manualHours")
    .addEventListener(
        "input",
        () => {

            if (
                !timerRunning &&
                currentMode === "manual"
            ) {

                remainingSeconds =
                    getManualSeconds();

                updateTimerDisplay();

                updateTimerButton();

            }

        }
    );


$("manualMinutes")
    .addEventListener(
        "input",
        () => {

            if (
                !timerRunning &&
                currentMode === "manual"
            ) {

                remainingSeconds =
                    getManualSeconds();

                updateTimerDisplay();

                updateTimerButton();

            }

        }
    );


/* =========================================================
   TASK MODAL EVENTS
========================================================= */

$("addTaskButton")
    .addEventListener(
        "click",
        () => {

            openTaskModal();

        }
    );


$("closeTaskModal")
    .addEventListener(
        "click",
        closeTaskModal
    );


$("cancelTaskButton")
    .addEventListener(
        "click",
        closeTaskModal
    );


$("saveTaskButton")
    .addEventListener(
        "click",
        saveTaskFromModal
    );


$("taskModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("taskModal")
            ) {

                closeTaskModal();

            }

        }
    );


$("taskName")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                saveTaskFromModal();

            }

        }
    );


/* =========================================================
   ANALYTICS RANGE
========================================================= */

$$(".range-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentRange =
                    button.dataset.range;


                $$(".range-button")
                    .forEach(
                        other => {

                            other.classList.toggle(
                                "active",
                                other === button
                            );

                        }
                    );


                drawAllCharts();

            }
        );

    });


/* =========================================================
   CHART DATE RANGE
========================================================= */

function getChartDates() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const dates = [];


    if (currentRange === "day") {

        /*
           Day view = last 7 days.
           This keeps the chart useful on a phone
           rather than showing only one point.
        */

        for (
            let i = 6;
            i >= 0;
            i--
        ) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() - i
            );

            dates.push(date);

        }

    }


    if (currentRange === "week") {

        /*
           Week view = last 8 weeks.
        */

        for (
            let i = 7;
            i >= 0;
            i--
        ) {

            const date =
                new Date(today);

            date.setDate(
                today.getDate() -
                i * 7
            );

            dates.push(date);

        }

    }


    if (currentRange === "month") {

        /*
           Month view = last 12 months.
        */

        for (
            let i = 11;
            i >= 0;
            i--
        ) {

            const date =
                new Date(
                    today.getFullYear(),
                    today.getMonth() - i,
                    1
                );

            dates.push(date);

        }

    }


    return dates;

}


function getDateKey(date) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}


/* =========================================================
   CHART DATA
========================================================= */

function getTaskChartData() {

    const dates =
        getChartDates();


    const physics = [];

    const chemistry = [];

    const biology = [];


    dates.forEach(date => {

        const key =
            getDateKey(date);


        if (
            currentRange === "day"
        ) {

            const day =
                appData.days[key];

            physics.push(
                day?.subjects?.physics?.tasks || 0
            );

            chemistry.push(
                day?.subjects?.chemistry?.tasks || 0
            );

            biology.push(
                day?.subjects?.biology?.tasks || 0
            );

        } else {

            const range =
                getAggregatedPeriod(
                    date
                );

            physics.push(
                range.physics.tasks
            );

            chemistry.push(
                range.chemistry.tasks
            );

            biology.push(
                range.biology.tasks
            );

        }

    });


    return {
        dates,
        physics,
        chemistry,
        biology
    };

}


function getQuestionChartData() {

    const dates =
        getChartDates();


    const physics = [];

    const chemistry = [];

    const biology = [];


    dates.forEach(date => {

        if (
            currentRange === "day"
        ) {

            const key =
                getDateKey(date);

            const day =
                appData.days[key];


            physics.push(
                day?.subjects?.physics?.questions || 0
            );

            chemistry.push(
                day?.subjects?.chemistry?.questions || 0
            );

            biology.push(
                day?.subjects?.biology?.questions || 0
            );

        } else {

            const range =
                getAggregatedPeriod(
                    date
                );

            physics.push(
                range.physics.questions
            );

            chemistry.push(
                range.chemistry.questions
            );

            biology.push(
                range.biology.questions
            );

        }

    });


    return {
        dates,
        physics,
        chemistry,
        biology
    };

}


function getTimeChartData() {

    const dates =
        getChartDates();


    const values = [];


    dates.forEach(date => {

        if (
            currentRange === "day"
        ) {

            const key =
                getDateKey(date);

            values.push(
                appData.days[key]?.studySeconds || 0
            );

        } else {

            const range =
                getAggregatedPeriod(
                    date
                );

            values.push(
                range.studySeconds
            );

        }

    });


    return {
        dates,
        values
    };

}


/* =========================================================
   PERIOD AGGREGATION
========================================================= */

function getAggregatedPeriod(date) {

    let start;
    let end;


    if (currentRange === "week") {

        start =
            new Date(date);

        start.setDate(
            date.getDate() - 6
        );

        end =
            new Date(date);

    } else {

        start =
            new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            );

        end =
            new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0
            );

    }


    start.setHours(
        0,
        0,
        0,
        0
    );

    end.setHours(
        23,
        59,
        59,
        999
    );


    const result = {

        studySeconds: 0,

        physics: {
            tasks: 0,
            questions: 0
        },

        chemistry: {
            tasks: 0,
            questions: 0
        },

        biology: {
            tasks: 0,
            questions: 0
        }

    };


    Object.keys(appData.days)
        .forEach(key => {

            const dayDate =
                getDateFromKey(key);

            if (
                dayDate >= start &&
                dayDate <= end
            ) {

                const day =
                    appData.days[key];

                result.studySeconds +=
                    day.studySeconds || 0;


                [
                    "physics",
                    "chemistry",
                    "biology"
                ].forEach(subject => {

                    result[subject].tasks +=
                        day.subjects?.[
                            subject
                        ]?.tasks || 0;

                    result[subject].questions +=
                        day.subjects?.[
                            subject
                        ]?.questions || 0;

                });

            }

        });


    return result;

}


/* =========================================================
   CANVAS CHART SYSTEM
========================================================= */

function prepareCanvas(canvas) {

    if (!canvas) {

        return null;

    }


    const rect =
        canvas.getBoundingClientRect();

    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * ratio;

    canvas.height =
        rect.height * ratio;


    const ctx =
        canvas.getContext("2d");

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );


    return {
        ctx,
        width: rect.width,
        height: rect.height
    };

}


/* =========================================================
   CHART LABELS
========================================================= */

function getChartLabel(date) {

    if (currentRange === "month") {

        return date.toLocaleDateString(
            undefined,
            {
                month: "short"
            }
        );

    }

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short"
        }
    );

}


/* =========================================================
   GENERIC LINE CHART
========================================================= */

function drawLineChart(
    canvas,
    series,
    options = {}
) {

    const prepared =
        prepareCanvas(canvas);

    if (!prepared) {

        return;

    }


    const {
        ctx,
        width,
        height
    } = prepared;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const padding = {

        left: 35,

        right: 10,

        top: 15,

        bottom: 25

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    let maxValue = 1;


    series.forEach(item => {

        item.values.forEach(value => {

            maxValue =
                Math.max(
                    maxValue,
                    Number(value) || 0
                );

        });

    });


    /*
       Nice upper bound.
    */

    maxValue =
        Math.ceil(
            maxValue * 1.15
        );


    if (maxValue <= 0) {

        maxValue = 1;

    }


    /*
       Grid lines
    */

    ctx.strokeStyle =
        "rgba(38,53,45,0.08)";

    ctx.lineWidth = 1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding.top +
            chartHeight *
            (i / 4);


        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width - padding.right,
            y
        );

        ctx.stroke();


        const value =
            Math.round(
                maxValue *
                (1 - i / 4)
            );


        ctx.fillStyle =
            "rgba(111,120,111,0.8)";

        ctx.font =
            "9px sans-serif";

        ctx.textAlign =
            "right";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            value,
            padding.left - 7,
            y
        );

    }


    /*
       X labels
    */

    const count =
        series[0]?.values.length || 0;


    if (count > 0) {

        series[0].dates.forEach(
            (date, index) => {

                const x =
                    count === 1
                        ? padding.left +
                          chartWidth / 2
                        : padding.left +
                          (
                              index /
                              (count - 1)
                          ) *
                          chartWidth;


                ctx.fillStyle =
                    "rgba(111,120,111,0.8)";

                ctx.font =
                    "9px sans-serif";

                ctx.textAlign =
                    "center";

                ctx.textBaseline =
                    "top";

                ctx.fillText(
                    getChartLabel(date),
                    x,
                    height - 17
                );

            }
        );

    }


    /*
       Lines
    */

    series.forEach(item => {

        const values =
            item.values;


        if (!values.length) {

            return;

        }


        ctx.beginPath();


        values.forEach(
            (value, index) => {

                const x =
                    values.length === 1
                        ? padding.left +
                          chartWidth / 2
                        : padding.left +
                          (
                              index /
                              (values.length - 1)
                          ) *
                          chartWidth;


                const y =
                    padding.top +
                    chartHeight -
                    (
                        (
                            Number(value) || 0
                        ) /
                        maxValue
                    ) *
                    chartHeight;


                if (index === 0) {

                    ctx.moveTo(
                        x,
                        y
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );

                }

            }
        );


        ctx.strokeStyle =
            item.color;

        ctx.lineWidth = 2.5;

        ctx.lineJoin =
            "round";

        ctx.lineCap =
            "round";

        ctx.stroke();


        /*
           Points
        */

        values.forEach(
            (value, index) => {

                const x =
                    values.length === 1
                        ? padding.left +
                          chartWidth / 2
                        : padding.left +
                          (
                              index /
                              (values.length - 1)
                          ) *
                          chartWidth;


                const y =
                    padding.top +
                    chartHeight -
                    (
                        (
                            Number(value) || 0
                        ) /
                        maxValue
                    ) *
                    chartHeight;


                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    3,
                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    item.color;

                ctx.fill();

            }
        );

    });

}


/* =========================================================
   TASK GRAPH
========================================================= */

function drawTasksChart() {

    const canvas =
        $("tasksChart");

    const data =
        getTaskChartData();


    drawLineChart(
        canvas,
        [
            {
                values: data.physics,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--physics"
                    )
            },

            {
                values: data.chemistry,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--chemistry"
                    )
            },

            {
                values: data.biology,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--biology"
                    )
            }
        ]
    );


    const hasData =
        data.physics.some(
            value => value > 0
        ) ||
        data.chemistry.some(
            value => value > 0
        ) ||
        data.biology.some(
            value => value > 0
        );


    $("tasksChartEmpty").hidden =
        hasData;

}


/* =========================================================
   QUESTIONS GRAPH
========================================================= */

function drawQuestionsChart() {

    const canvas =
        $("questionsChart");

    const data =
        getQuestionChartData();


    drawLineChart(
        canvas,
        [
            {
                values: data.physics,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--physics"
                    )
            },

            {
                values: data.chemistry,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--chemistry"
                    )
            },

            {
                values: data.biology,
                dates: data.dates,
                color:
                    getCSSColor(
                        "--biology"
                    )
            }
        ]
    );


    const hasData =
        data.physics.some(
            value => value > 0
        ) ||
        data.chemistry.some(
            value => value > 0
        ) ||
        data.biology.some(
            value => value > 0
        );


    $("questionsChartEmpty").hidden =
        hasData;

}


/* =========================================================
   TIME GRAPH
========================================================= */

function drawTimeChart() {

    const canvas =
        $("timeChart");

    const data =
        getTimeChartData();


    drawLineChart(
        canvas,
        [
            {
                values:
                    data.values.map(
                        seconds =>
                            Math.round(
                                seconds / 60
                            )
                    ),

                dates:
                    data.dates,

                color:
                    getCSSColor(
                        "--green"
                    )
            }
        ]
    );


    const hasData =
        data.values.some(
            value => value > 0
        );


    $("timeChartEmpty").hidden =
        hasData;

}


/* =========================================================
   DRAW EVERYTHING
========================================================= */

function drawAllCharts() {

    /*
       Canvas elements may not have their final
       dimensions until the browser has rendered.
    */

    requestAnimationFrame(
        () => {

            drawTasksChart();

            drawTimeChart();

            drawQuestionsChart();

        }
    );

}


function getCSSColor(variable) {

    return getComputedStyle(
        document.documentElement
    )
        .getPropertyValue(variable)
        .trim();

}


/* =========================================================
   WINDOW RESIZE
========================================================= */

let resizeTimeout = null;

window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimeout
        );

        resizeTimeout =
            setTimeout(
                drawAllCharts,
                120
            );

    }
);


/* =========================================================
   MIDNIGHT / NEW DAY CHECK
========================================================= */

let lastKnownDate =
    getTodayKey();


setInterval(
    () => {

        const today =
            getTodayKey();

        if (
            today !==
            lastKnownDate
        ) {

            lastKnownDate =
                today;

            getTodayData();

            saveData();

            updateHeader();

            renderTasks();

            updateDashboard();

            updateTotals();

            updateHistory();

            drawAllCharts();

        }

    },
    30000
);


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            /*
               Re-render after returning to the app.
               This is especially useful on mobile browsers.
            */

            updateHeader();

            updateDashboard();

            updateTotals();

            drawAllCharts();

        }

    }
);


/* =========================================================
   KEYBOARD ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !$("taskModal").hidden
        ) {

            closeTaskModal();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

initializeApp();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("NEET Command Center offline mode ready.");
            })
            .catch(error => {
                console.error("Service worker registration failed:", error);
            });
    });
}
console.log(
    "NEET Command Center V1 loaded successfully."
);