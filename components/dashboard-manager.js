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
        // UPDATED: Standardized name so the HTML Lock Button can pause the engine
        window.THPS.Dashboard.sortableInstance = new Sortable(grid, {
            animation: 250,                     
            ghostClass: 'opacity-40',           
            dragClass: 'scale-105',             
            easing: "cubic-bezier(0.25, 1, 0.5, 1)", 
            filter: 'button',                   // Prevent dragging when clicking the "x" button
            preventOnFilter: false,
            onEnd: function (evt) {
                console.log(`Widget moved from slot ${evt.oldIndex} to ${evt.newIndex}`);
            },
        });
        console.log("Trackman Drag-and-Drop Grid Initialized!");
    } else {
        console.error("SortableJS library not loaded!");
    }
};

// --- NEW: WIDGET SPAWNING ENGINE ---
window.THPS.Dashboard.spawnWidget = function(widgetTag, sizeClasses, btnElement) {
    const grid = document.getElementById('thps-dashboard-grid');
    if (!grid) return;

    const originalHTML = btnElement.innerHTML;

    // 1. Enforce the 1-copy limit
    if (grid.querySelector(widgetTag)) {
        btnElement.innerHTML = `<i data-lucide="check" class="w-3 h-3 md:w-4 md:h-4 mb-0.5 md:mb-1"></i> Already Added`;
        btnElement.classList.replace('text-blue-600', 'text-green-600');
        if (window.lucide) window.lucide.createIcons();
        
        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.classList.replace('text-green-600', 'text-blue-600');
            if (window.lucide) window.lucide.createIcons();
        }, 1500);
        return;
    }

    // 2. Build the exact wrapper needed for the grid layout
    const wrapper = document.createElement('div');
    sizeClasses.split(' ').forEach(cls => {
        if (cls.trim()) wrapper.classList.add(cls);
    });
    wrapper.classList.add('cursor-move', 'relative', 'group');

    // 3. Insert the Custom Web Component
    const widget = document.createElement(widgetTag);
    wrapper.appendChild(widget);
    grid.appendChild(wrapper);

    // 4. Success feedback on the menu button
    btnElement.innerHTML = `<i data-lucide="check" class="w-3 h-3 md:w-4 md:h-4 mb-0.5 md:mb-1"></i> Added!`;
    btnElement.classList.replace('text-blue-600', 'text-green-600');
    if (window.lucide) window.lucide.createIcons();

    // Reset button after 1.5s
    setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        btnElement.classList.replace('text-green-600', 'text-blue-600');
        if (window.lucide) window.lucide.createIcons();
    }, 1500);
};

// Initialize as soon as the browser is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.THPS.Dashboard.initGrid);
} else {
    window.THPS.Dashboard.initGrid();
}
