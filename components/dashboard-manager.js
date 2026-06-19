// ==========================================
// THPS DASHBOARD MANAGER
// Handles Drag-and-Drop and Widget Spawning
// ==========================================

window.THPS = window.THPS || {};
window.THPS.Dashboard = window.THPS.Dashboard || {};

window.THPS.Dashboard.initGrid = function() {
    const grid = document.getElementById('thps-dashboard-grid');
    if (!grid) {
        console.warn("THPS Dashboard Grid not found.");
        return;
    }

    // Initialize the SortableJS library on our grid
    if (typeof Sortable !== 'undefined') {
        window.THPS.Dashboard.sortable = new Sortable(grid, {
            animation: 250,                     // Smooth fluid animation (ms)
            ghostClass: 'opacity-40',           // Dims the original spot while dragging
            dragClass: 'scale-105',             // Slightly enlarges the widget while dragging
            easing: "cubic-bezier(0.25, 1, 0.5, 1)", 
            filter: 'button',                   // Prevent dragging when clicking the "x" button
            preventOnFilter: false,
            onEnd: function (evt) {
                console.log(`Widget moved from slot ${evt.oldIndex} to ${evt.newIndex}`);
                // In the future, we can save the user's layout order to their browser here!
            },
        });
        console.log("Trackman Drag-and-Drop Grid Initialized!");
    } else {
        console.error("SortableJS library not loaded!");
    }
};

// Initialize as soon as the browser is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.THPS.Dashboard.initGrid);
} else {
    window.THPS.Dashboard.initGrid();
}
