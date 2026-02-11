/* ============================================
   PERIOD CARE COMPANION - JAVASCRIPT
   All functionality and data management
   ============================================ */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializePeriodTracker();
    initializeMoodTracker();
    initializeChecklist();
    initializeSupportMessages();
    loadAllData();
});

// ============================================
// NAVIGATION
// ============================================

function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            switchSection(sectionId);
        });
    });
}

function switchSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Deactivate all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Activate corresponding nav button
    const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Refresh visualizations if needed
    if (sectionId === 'mood') {
        setTimeout(() => renderMoodChart(), 100);
    }
}

// ============================================
// PERIOD TRACKER
// ============================================

function initializePeriodTracker() {
    const saveBtn = document.getElementById('saveTrackerBtn');
    saveBtn.addEventListener('click', savePeriodData);

    // Load existing data if available
    const saved = localStorage.getItem('periodData');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('cycleStart').value = data.startDate;
        document.getElementById('cycleLength').value = data.cycleLength;
        document.getElementById('periodLength').value = data.periodLength;
        updateTrackerDisplay(data);
        document.getElementById('trackerInfo').style.display = 'block';
    }
}

function savePeriodData() {
    const startDate = document.getElementById('cycleStart').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    const periodLength = parseInt(document.getElementById('periodLength').value);

    if (!startDate) {
        alert('Please select your cycle start date!');
        return;
    }

    const data = {
        startDate,
        cycleLength,
        periodLength
    };

    localStorage.setItem('periodData', JSON.stringify(data));
    updateTrackerDisplay(data);
    document.getElementById('trackerInfo').style.display = 'block';
}

function updateTrackerDisplay(data) {
    const start = new Date(data.startDate);
    
    // Calculate key dates
    const periodEnd = new Date(start);
    periodEnd.setDate(periodEnd.getDate() + data.periodLength - 1);

    const ovulationDay = new Date(start);
    ovulationDay.setDate(ovulationDay.getDate() + Math.floor(data.cycleLength / 2));

    const fertileStart = new Date(ovulationDay);
    fertileStart.setDate(fertileStart.getDate() - 5);

    const fertileEnd = new Date(ovulationDay);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    const nextPeriod = new Date(start);
    nextPeriod.setDate(nextPeriod.getDate() + data.cycleLength);

    // Update stat cards
    document.getElementById('periodDaysCount').textContent = `${data.periodLength} days`;
    document.getElementById('fertileDaysCount').textContent = `${getDateRange(fertileStart, fertileEnd)}`;
    document.getElementById('ovulationDay').textContent = formatDate(ovulationDay);
    document.getElementById('nextPeriod').textContent = formatDate(nextPeriod);

    // Generate calendar
    generateCycleCalendars(data, start, ovulationDay, fertileStart, fertileEnd, periodEnd);
}

function generateCycleCalendars(data, start, ovulation, fertileStart, fertileEnd, periodEnd) {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';

    // Generate 3 months of calendars
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const calendarDate = new Date(start);
        calendarDate.setMonth(calendarDate.getMonth() + monthOffset);

        const calendar = createMonthCalendar(
            calendarDate.getFullYear(),
            calendarDate.getMonth(),
            data,
            start,
            ovulation,
            fertileStart,
            fertileEnd,
            periodEnd
        );
        container.appendChild(calendar);
    }
}

function createMonthCalendar(year, month, data, cycleStart, ovulation, fertileStart, fertileEnd, periodEnd) {
    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.textContent = `${monthNames[month]} ${year}`;

    const dayLabels = document.createElement('div');
    dayLabels.className = 'calendar-grid';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const label = document.createElement('div');
        label.textContent = day;
        label.style.fontWeight = '600';
        label.style.textAlign = 'center';
        label.style.padding = '8px 0';
        dayLabels.appendChild(label);
    });

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    let currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cycleStartDate = new Date(cycleStart);
    cycleStartDate.setHours(0, 0, 0, 0);

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        if (currentDate.getMonth() !== month) {
            cell.classList.add('other-month');
            cell.textContent = currentDate.getDate();
        } else {
            cell.textContent = currentDate.getDate();

            const cellDateOnly = new Date(currentDate);
            cellDateOnly.setHours(0, 0, 0, 0);

            if (cellDateOnly.getTime() === today.getTime()) {
                cell.classList.add('today');
            }

            // Check cycle day
            const dayInCycle = Math.floor((cellDateOnly - cycleStartDate) / (1000 * 60 * 60 * 24)) % data.cycleLength;

            if (dayInCycle >= 0 && dayInCycle < data.periodLength) {
                cell.classList.add('period');
            } else if (cellDateOnly >= fertileStart && cellDateOnly <= fertileEnd) {
                cell.classList.add('fertile');
            } else if (cellDateOnly.getTime() === new Date(ovulation).setHours(0, 0, 0, 0)) {
                cell.classList.add('ovulation');
            }
        }

        grid.appendChild(cell);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    calendar.appendChild(header);
    calendar.appendChild(dayLabels);
    calendar.appendChild(grid);

    return calendar;
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getDateRange(start, end) {
    const startStr = start.getDate();
    const endStr = end.getDate();
    const month = start.toLocaleDateString('en-US', { month: 'short' });
    return `${startStr} - ${endStr} ${month}`;
}

// ============================================
// MOOD TRACKER
// ============================================

let selectedMood = null;

function initializeMoodTracker() {
    const moodButtons = document.querySelectorAll('.mood-btn');
    const recordBtn = document.getElementById('recordMoodBtn');
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove previous selection
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            // Add selection to clicked button
            this.classList.add('selected');
            selectedMood = parseInt(this.dataset.mood);
            recordBtn.style.display = 'inline-block';
        });
    });

    recordBtn.addEventListener('click', recordMood);

    // Load and display mood history
    displayMoodHistory();
}

function recordMood() {
    if (!selectedMood) return;

    const moodData = JSON.parse(localStorage.getItem('moodData') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const note = document.getElementById('moodNotes').value;

    // Remove today's entry if exists
    const filtered = moodData.filter(entry => entry.date !== today);
    filtered.push({
        date: today,
        mood: selectedMood,
        note: note
    });

    localStorage.setItem('moodData', JSON.stringify(filtered));

    // Clear inputs
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('moodNotes').value = '';
    document.getElementById('recordMoodBtn').style.display = 'none';
    selectedMood = null;

    alert('Mood recorded! 💜');
    displayMoodHistory();
}

function displayMoodHistory() {
    const moodData = JSON.parse(localStorage.getItem('moodData') || '[]');
    const container = document.getElementById('moodEntries');

    if (moodData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #8B7B9F;">Start tracking to see your mood patterns</p>';
        return;
    }

    container.innerHTML = moodData.slice().reverse().map(entry => {
        const moods = ['😢', '😕', '😐', '🙂', '😄'];
        const moodEmoji = moods[entry.mood - 1];
        const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="mood-entry">
                <div class="mood-entry-date">${date}</div>
                <div class="mood-entry-mood">${moodEmoji}</div>
                ${entry.note ? `<div class="mood-entry-note">"${entry.note}"</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderMoodChart() {
    const moodData = JSON.parse(localStorage.getItem('moodData') || '[]');
    const canvas = document.getElementById('moodChart');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (moodData.length === 0) {
        ctx.fillStyle = '#8B7B9F';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data yet. Start tracking!', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Sort by date
    const sorted = moodData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = sorted.filter(entry => new Date(entry.date) >= thirtyDaysAgo);

    if (recent.length === 0) {
        ctx.fillStyle = '#8B7B9F';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data in the last 30 days', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Draw simple line chart
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const pointSpacing = chartWidth / (recent.length - 1 || 1);

    // Draw axes
    ctx.strokeStyle = '#E6D7F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#F0E5F5';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }

    // Draw mood labels on y-axis
    const moodLabels = ['😢', '😕', '😐', '🙂', '😄'];
    ctx.fillStyle = '#8B7B9F';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    moodLabels.forEach((label, i) => {
        const y = canvas.height - padding - (chartHeight / 4) * i;
        ctx.fillText(label, padding - 10, y + 4);
    });

    // Plot points and lines
    ctx.strokeStyle = '#D4618B';
    ctx.lineWidth = 2;
    ctx.beginPath();

    recent.forEach((entry, index) => {
        const x = padding + pointSpacing * index;
        const y = canvas.height - padding - ((entry.mood - 1) / 4) * chartHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#D4618B';
    recent.forEach((entry, index) => {
        const x = padding + pointSpacing * index;
        const y = canvas.height - padding - ((entry.mood - 1) / 4) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================
// CHECKLIST
// ============================================

function initializeChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateChecklistProgress);
    });

    // Load saved checklist state
    loadChecklistState();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.checklist-input');
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const total = checkboxes.length;
    const percentage = (checked / total) * 100;

    const progressSection = document.getElementById('checklistProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (checked > 0) {
        progressSection.style.display = 'block';
    }

    progressFill.style.width = percentage + '%';
    progressFill.textContent = Math.round(percentage) + '%';
    progressText.textContent = `You've completed ${checked} of ${total} tasks today. Great job! 💪`;

    // Save checklist state
    saveChecklistState();
}

function saveChecklistState() {
    const today = new Date().toISOString().split('T')[0];
    const checkboxes = document.querySelectorAll('.checklist-input');
    const state = {};

    checkboxes.forEach(checkbox => {
        state[checkbox.id] = checkbox.checked;
    });

    const checklistData = JSON.parse(localStorage.getItem('checklistData') || '{}');
    checklistData[today] = state;
    localStorage.setItem('checklistData', JSON.stringify(checklistData));
}

function loadChecklistState() {
    const today = new Date().toISOString().split('T')[0];
    const checklistData = JSON.parse(localStorage.getItem('checklistData') || '{}');
    const state = checklistData[today] || {};

    const checkboxes = document.querySelectorAll('.checklist-input');
    checkboxes.forEach(checkbox => {
        checkbox.checked = state[checkbox.id] || false;
    });

    // Update progress display
    updateChecklistProgress();
}

// ============================================
// SUPPORT MESSAGES
// ============================================

const supportMessages = [
    "You are stronger than you think. This will pass. 💜",
    "It's okay to rest. Your body needs care right now.",
    "You deserve compassion—especially from yourself.",
    "Every day gets a little easier. Hang in there! 💪",
    "Your pain is valid. You're doing amazing.",
    "This is temporary. You've got this! ✨",
    "Be as kind to yourself as you are to others.",
    "You are more than your period. You are incredible.",
    "Reach out if you need support. You're not alone.",
    "Rest is productive. Rest is healing. Rest is right.",
    "Your body is working so hard for you. Thank it.",
    "Tomorrow will feel better. I promise. 💙",
    "You are brave. You are beautiful. You are enough.",
    "This moment is hard, but you are harder.",
    "Take a break. You've earned it. 💕",
    "Your feelings matter. Your needs matter. You matter.",
    "Be patient with yourself. Healing takes time.",
    "You are doing better than you think you are.",
    "This discomfort doesn't define you.",
    "You have overcome challenges before. You'll overcome this too."
];

function initializeSupportMessages() {
    const newMessageBtn = document.getElementById('newMessageBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');

    newMessageBtn.addEventListener('click', displayRandomMessage);
    saveNotesBtn.addEventListener('click', savePersonalNotes);

    // Display initial message
    displayRandomMessage();

    // Load personal notes
    const saved = localStorage.getItem('personalNotes');
    if (saved) {
        document.getElementById('personalNotes').value = saved;
    }
}

function displayRandomMessage() {
    const message = supportMessages[Math.floor(Math.random() * supportMessages.length)];
    document.getElementById('dailyMessage').textContent = message;
}

function savePersonalNotes() {
    const notes = document.getElementById('personalNotes').value;
    localStorage.setItem('personalNotes', notes);
    alert('Notes saved! 💜');
}

// ============================================
// DATA MANAGEMENT
// ============================================

function loadAllData() {
    // This is called on page load to restore all data from localStorage
    // Individual load functions are called in their respective init functions
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Export data (for user backup)
function exportData() {
    const data = {
        periodData: localStorage.getItem('periodData'),
        moodData: localStorage.getItem('moodData'),
        checklistData: localStorage.getItem('checklistData'),
        personalNotes: localStorage.getItem('personalNotes'),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `period-care-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Clear all data (with confirmation)
function clearAllData() {
    if (confirm('Are you sure? This will delete all your data. This cannot be undone.')) {
        localStorage.clear();
        alert('All data has been cleared. Please refresh the page.');
        location.reload();
    }
}
