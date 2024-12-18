const searchInput = document.getElementById('search');
searchInput.addEventListener('input', function () {
    const query = searchInput.value.toLowerCase();
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
    );
    loadFilteredTasks(filteredTasks);
});

function startTask(index) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const task = tasks[index];

    if (!task.totalTime || task.totalTime <= 0) {
        alert("Task is already completed or has no remaining time.");
        return;
    }

    if (task.isRunning) return; 

    task.timer = setInterval(function () {
        if (task.totalTime > 0) {
            task.totalTime--;
            document.getElementById(`time-${index}`).textContent = formatTime(task.totalTime);
        } else {
            clearInterval(task.timer);
            task.isRunning = false;
            task.completed = true;
            markTaskNonInteractive(index);
            alert('Task Completed!');
            saveTasks(tasks);
            loadTasks();
        }
    }, 1000);

    task.isRunning = true;
    task.isPaused = false;
    saveTasks(tasks);
    loadTasks();
}


function pauseTask(index) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let task = tasks[index];

    clearInterval(task.timer);
    task.isRunning = false;
    task.isPaused = true;

    document.querySelector(`.task-card[data-index="${index}"] .pause-btn`).style.display = 'none';
    document.querySelector(`.task-card[data-index="${index}"] .continue-btn`).style.display = 'inline-block';
    saveTasks(tasks);
}


function continueTask(index) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let task = tasks[index];

    task.timer = setInterval(function() {
        if (task.totalTime > 0) {
            task.totalTime--;
            document.getElementById(`time-${index}`).textContent = formatTime(task.totalTime);
        } else {
            clearInterval(task.timer);
            task.isRunning = false;
            task.completed = true;
            task.completedDate = new Date().toISOString().split('T')[0]; 
            alert('Task Completed!');
            saveTasks(tasks);
            loadTasks();
        }
    }, 1000);

    task.isRunning = true;
    task.isPaused = false;

    document.querySelector(`.task-card[data-index="${index}"] .continue-btn`).style.display = 'none';
    document.querySelector(`.task-card[data-index="${index}"] .pause-btn`).style.display = 'inline-block';
    saveTasks(tasks);
}

// Clear All Tasks
const clearButton = document.querySelector('.clear-btn');
clearButton.addEventListener('click', function () {
    if (confirm('Are you sure you want to clear all tasks?')) {
        localStorage.removeItem('tasks');
        loadTasks(); 
        refreshSummaries(); 
    }
});

function formatTimeHHMM(dateString) {
    const date = new Date(`1970-01-01T${dateString}Z`); 
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; 

    return `${hours}:${padZero(minutes)} ${period}`;
}


function calculateTotalTime(startTime, endTime) {
    if (!startTime || !endTime) {
        console.error("Invalid startTime or endTime:", { startTime, endTime });
        return "00:00:00";
    }

    const start = new Date(`1970-01-01T${startTime}`);
    let end = new Date(`1970-01-01T${endTime}`);

    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    const totalSeconds = (end - start) / 1000;

    return formatTime(totalSeconds);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) return "00:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
}

function padZero(num) {
    return num < 10 ? `0${num}` : num;
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isFutureDate(date) {
    const today = new Date();
    return date > today; 
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}


function loadTasks(filter = 'all') {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskContainer = document.getElementById('task-container');
    taskContainer.innerHTML = ''; 

    let filteredTasks = [];
    if (filter === 'all') {
        filteredTasks = tasks; 
    } else if (filter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed && task.totalTime > 0);
    } else if (filter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed || task.totalTime === 0);
    }

    filteredTasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskContainer.appendChild(taskElement);
    });
}

function calculateHours(startTime, endTime) {
    const start = new Date(`1970-01-01T${startTime}Z`);
    const end = new Date(`1970-01-01T${endTime}Z`);
    let diff = (end - start) / (1000 * 60 * 60); 
    if (diff < 0) diff += 24; 
    return diff;
}
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
    
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        
        const filter = button.id;
        loadTasks(filter);
    });
});


function createTaskElement(task, index, isFuture) {
    const taskElement = document.createElement('li');
    taskElement.classList.add('task-card');
    taskElement.dataset.index = index;

    if (task.completed || task.totalTime === 0) {
        taskElement.classList.add('completed'); 
    }
    if (isFuture) {
        taskElement.classList.add('future-task'); 
    }

    taskElement.innerHTML = `
        <div class="task-info">
            <input type="checkbox" id="task-checkbox-${index}" 
            ${task.completed ? 'checked' : ''} 
            onclick="toggleCompletion(${index})">
            <span class="task-number">${index + 1}</span>
            <div>
                <p class="task-description">${task.description}</p>
                <p class="task-title">${task.title}</p>
            </div>
        </div>
        <div class="task-details">
            <div class="task-category">
                <i class="fa-solid fa-tags"></i>
                <span class="category">${task.category}</span>
            </div>
            <div class="task-time">
                <span class="start-time">${formatTimeHHMM(task.startTime)}</span> - 
                <span class="end-time">${formatTimeHHMM(task.endTime)}</span>
            </div>
            <div class="total-time">
                <i class="fa-solid fa-clock"></i>
                <span class="time" id="time-${index}">${calculateTotalTime(task.startTime, task.endTime)}</span>
            </div>
            <div class="control-time">
            <button class="action-button startBtn" onclick="startTask(${index})" ${isFuture ? 'disabled' : ''}>Start</button>
            <button class="action-button pauseBtn" onclick="pauseTask(${index})" ${isFuture ? 'disabled' : ''}>Pause</button>
            </div>
            <div class="settings">
                <i onclick="showMenu(this)"class="fa fa-ellipsis-h"></i>
                <ul class="task-menu">
                    <li onclick="editTask(${index})"><i class="fa-solid fa-pen"></i>Edit</li>
                    <li onclick="deleteTask(${index})"><i class="fa fa-trash"></i>Delete</li>
                </ul>
            </div>
        </div>
    `;

    return taskElement;
}
function showMenu(selectedTask) {
    const taskMenu = selectedTask.parentElement.querySelector(".task-menu");
    taskMenu.classList.add("show");

    document.addEventListener("click", function handleClickOutside(event) {
        if (!taskMenu.contains(event.target) && event.target !== selectedTask) {
            taskMenu.classList.remove("show");
            document.removeEventListener("click", handleClickOutside); // Remove listener after menu is hidden
        }
    });
}



function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
document.getElementById('task-container').addEventListener('click', function (e) {
    if (e.target.classList.contains('task-checkbox')) {
        const index = e.target.dataset.index;
        toggleCompletion(index);
    }
});


document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const taskTitle = document.getElementById('taskTitle').value.trim();
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const taskPriority = document.getElementById('taskPriority').value;
    const taskCategory = document.getElementById('task-category').value;
    const taskDay = document.getElementById('taskDay').value;
    const taskStartTime = document.getElementById('taskStartTime').value;
    const taskEndTime = document.getElementById('taskEndTime').value;

    if (!taskTitle || !taskDescription || !taskDay || !taskStartTime || !taskEndTime) {
        alert('All fields must be filled out!');
        return;
    }

    if (taskExists(taskTitle, taskDescription, taskDay, taskStartTime, taskEndTime)) {
        alert('This task already exists!');
        return;
    }

    const newTask = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        category: taskCategory,
        day: taskDay,
        startTime: taskStartTime,
        endTime: taskEndTime,
        completed: false
    };

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    renderTasks(); 
    document.getElementById('taskForm').reset();
});


function markTaskNonInteractive(index) {
    const taskCard = document.querySelector(`.task-card[data-index="${index}"]`);
    if (taskCard) {
        taskCard.classList.add('completed');
        const actionButtons = taskCard.querySelectorAll('.action-button');
        actionButtons.forEach(button => button.style.display = 'none');
    }
}


function toggleCompletion(index) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const task = tasks[index];

    if (!task) return; 

    task.completed = !task.completed;

    if (task.completed) {
        task.isRunning = false;
        task.isPaused = false;
        clearInterval(task.timer);
        markTaskNonInteractive(index);
    }

    saveTasks(tasks);
    loadTasks();
}


function editTask(index) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let task = tasks[index];

    
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('task-category').value = task.category;
    document.getElementById('taskDay').value = task.day;
    document.getElementById('taskStartTime').value = task.startTime;
    document.getElementById('taskEndTime').value = task.endTime;

    
    const submitButton = document.querySelector('.form-actions button');
    submitButton.textContent = 'Update Task';

    
    const form = document.getElementById('taskForm');
    form.onsubmit = function (e) {
        e.preventDefault();

        task.title = document.getElementById('taskTitle').value;
        task.description = document.getElementById('taskDescription').value;
        task.priority = document.getElementById('taskPriority').value;
        task.category = document.getElementById('task-category').value;
        task.day = document.getElementById('taskDay').value;
        task.startTime = document.getElementById('taskStartTime').value;
        task.endTime = document.getElementById('taskEndTime').value;

        
        tasks[index] = task;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        
        form.reset();
        submitButton.textContent = 'Add Task';
        form.onsubmit = addTask; 

        loadTasks();
        refreshSummaries();
    };
}


function addTask(e) {
    e.preventDefault();

    const taskTitle = document.getElementById('taskTitle').value.trim();
    const taskDescription = document.getElementById('taskDescription').value.trim();
    const taskPriority = document.getElementById('taskPriority').value;
    const taskCategory = document.getElementById('task-category').value;
    const taskDay = document.getElementById('taskDay').value;
    const taskStartTime = document.getElementById('taskStartTime').value;
    const taskEndTime = document.getElementById('taskEndTime').value;

    if (!taskTitle || !taskDescription || !taskDay || !taskStartTime || !taskEndTime) {
        alert('All fields must be filled out!');
        return;
    }

    const totalTime = calculateTotalTime(taskStartTime, taskEndTime);

    const newTask = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        category: taskCategory,
        day: taskDay,
        startTime: taskStartTime,
        endTime: taskEndTime,
        totalTime: totalTime,
        isRunning: false,
        isPaused: false
    };

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    renderTasks();
    refreshSummaries();
    document.getElementById('taskForm').reset();
}

// Delete task functionality
function deleteTask(index) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.splice(index, 1); 

    saveTasks(tasks);
    loadTasks();
    refreshSummaries();
}
document.addEventListener('DOMContentLoaded', () => {
    const menuToggles = document.querySelectorAll('#menu-toggle'); 

    menuToggles.forEach((toggle) => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close other open menus
            document.querySelectorAll('.settings').forEach((item) => {
                if (item !== toggle.parentElement) {
                    item.classList.remove('active');
                }
            });

            // Toggle current menu
            toggle.parentElement.classList.toggle('active');
        });
    });

    // Close menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.settings').forEach((item) => {
            item.classList.remove('active');
        });
    });
});

function taskExists(title, description, day, startTime, endTime) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || []; 
    return tasks.some(task => 
        task.title === title &&
        task.description === description &&
        task.day === day &&
        task.startTime === startTime &&
        task.endTime === endTime
    );
}


function renderTasks() {
    const taskListContainer = document.getElementById('task-container');
    taskListContainer.innerHTML = ''; 

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.sort((a, b) => new Date(a.day) - new Date(b.day));


    const taskGroups = groupTasksByDate(tasks);


    for (const date in taskGroups) {
    
        const header = document.createElement('h3');
        header.textContent = formatDateHeader(date);
        taskListContainer.appendChild(header);

        taskGroups[date].forEach((task, index) => {
            const taskElement = createTaskElement(task, index);
            taskListContainer.appendChild(taskElement);
        });
    }
}

function groupTasksByDate(tasks) {
    const groups = {};
    tasks.forEach(task => {
        const date = task.day;
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
    });
    return groups;
}

function formatDateHeader(date) {
    const today = new Date();
    const taskDate = new Date(date);

    if (taskDate.toDateString() === today.toDateString()) {
        return 'Today';
    } else {
        return taskDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}


function loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = savedTasks; 
    renderTasks(); 
}

document.addEventListener('DOMContentLoaded', () => {
    renderTasks(); 
});

