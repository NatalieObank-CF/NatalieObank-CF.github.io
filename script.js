document.addEventListener('DOMContentLoaded', () => {
    const levelSelect = document.getElementById('level-select');
    const competenciesContainer = document.getElementById('competencies-container');
    const championsContainer = document.getElementById('champions-container');
    const guidanceModal = document.getElementById('guidance-section');
    const guidanceTitle = document.getElementById('guidance-title');
    const guidanceContent = document.getElementById('guidance-content');
    const closeModalButton = guidanceModal.querySelector('.close-button');
    document.getElementById('currentYear').textContent = new Date().getFullYear(); // Set current year

    let allCompetenciesData = {}; // To store data from competencies.json
    let userProgress = {}; // To store RAG status, evidence text, and evidence links

    // --- 1. DATA LOADING ---
    async function loadData() {
        try {
            const compResponse = await fetch('data/competencies.json?v=' + new Date().getTime()); // Cache buster for updates
            if (!compResponse.ok) throw new Error(`Failed to load competencies: ${compResponse.statusText}`);
            allCompetenciesData = await compResponse.json();

            const champResponse = await fetch('data/champions.json?v=' + new Date().getTime()); // Cache buster
            if (!champResponse.ok) throw new Error(`Failed to load champions: ${champResponse.statusText}`);
            const championsData = await champResponse.json();

            loadUserProgress(); // Load progress from localStorage
            populateLevelSelector();
            displayChampions(championsData.champions);
            displayCompetencies(); // Initial display
        } catch (error) {
            console.error("Error loading data:", error);
            competenciesContainer.innerHTML = `<p style="color:red;">Error loading competency data. Please check console or data files.</p>`;
            championsContainer.innerHTML = `<p style="color:red;">Error loading champion data.</p>`;
        }
    }

    // --- 2. USER PROGRESS (localStorage) ---
    function loadUserProgress() {
        const savedProgress = localStorage.getItem('baUserSelfTrackProgress'); // Use a unique key
        if (savedProgress) {
            userProgress = JSON.parse(savedProgress);
        }
    }

    function saveUserProgress() {
        localStorage.setItem('baUserSelfTrackProgress', JSON.stringify(userProgress));
        // console.log("Progress saved:", userProgress); // For debugging
    }

    // --- 3. DISPLAY FUNCTIONS ---
    function populateLevelSelector() {
        if (!allCompetenciesData.levels) {
            console.error("No levels found in competencies data.");
            return;
        }
        // Create "View All" option
        const allOption = document.createElement('option');
        allOption.value = "All";
        allOption.textContent = "View All Grades";
        levelSelect.appendChild(allOption);
        
        allCompetenciesData.levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.name; // Use level name as value
            option.textContent = level.name;
            levelSelect.appendChild(option);
        });

        levelSelect.value = "All"; // Default selection
        levelSelect.addEventListener('change', displayCompetencies);
    }

    // In script.js

function displayCompetencies() {
    competenciesContainer.innerHTML = ''; // Clear previous content
    const selectedLevelName = levelSelect.value;

    let levelsToDisplay = [];
    // ... (your existing logic for determining levelsToDisplay based on selectedLevelName) ...
    // This part should remain the same:
    if (selectedLevelName === "All") {
        levelsToDisplay = allCompetenciesData.levels;
    } else {
        const selectedIndex = allCompetenciesData.levels.findIndex(l => l.name === selectedLevelName);
        if (selectedIndex !== -1) {
            if (allCompetenciesData.levels[selectedIndex].name.toLowerCase().includes("mid")) {
                levelsToDisplay = allCompetenciesData.levels.slice(selectedIndex);
            } else {
                levelsToDisplay = [allCompetenciesData.levels[selectedIndex]];
            }
        } else {
            levelsToDisplay = []; // Should not happen if populated correctly
        }
    }


    if (levelsToDisplay.length === 0 && selectedLevelName !== "All") {
        competenciesContainer.innerHTML = "<p>No competencies defined for the selected level filter.</p>";
        return;
    }


    levelsToDisplay.forEach(level => {
        // Display level name
        const levelHeader = document.createElement('h3');
        levelHeader.className = 'level-title';
        levelHeader.textContent = level.name;
        competenciesContainer.appendChild(levelHeader);

        if (!level.competencies || level.competencies.length === 0) {
            const noCompMsg = document.createElement('p');
            noCompMsg.textContent = "No competencies listed for this level.";
            competenciesContainer.appendChild(noCompMsg);
            return; // Skip creating a table if no competencies
        }

        // Create table for the current level
        const table = document.createElement('table');
        table.className = 'competency-table';

        // Create table header (thead)
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ["Name", "Description", "Status", "Evidence", "How do I?"];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Create table body (tbody)
        const tbody = table.createTBody();

        level.competencies.forEach(comp => {
            const row = tbody.insertRow();
            row.dataset.competencyId = comp.id; // Keep for potential future use

            // 1. Name Cell
            const nameCell = row.insertCell();
            nameCell.textContent = comp.name;
            nameCell.className = 'competency-name-cell'; // For specific styling

            // 2. Description Cell
            const descCell = row.insertCell();
            descCell.className = 'competency-desc-cell';
            let descriptionText = comp.description || 'No description available.';
            descCell.innerHTML = descriptionText.replace(/\n/g, '<br>'); // Convert \n to <br>

            // 3. Status Cell
            const statusCell = row.insertCell();
            statusCell.className = 'competency-status-cell';
            const compProgress = userProgress[comp.id] || {};
            const currentStatus = compProgress.status || 'Not Started';

            const statusSelect = document.createElement('select');
            statusSelect.id = `status-${comp.id}`;
            statusSelect.dataset.compId = comp.id;
            statusSelect.className = 'status-select form-element'; // Keep existing class for event listeners
            statusSelect.innerHTML = `
                <option value="Not Started" ${currentStatus === 'Not Assessed' ? 'selected' : ''}>Not Assessed</option>
                <option value="R" ${currentStatus === 'R' ? 'selected' : ''}>🔴 No Knowledge</option>
                <option value="A" ${currentStatus === 'A' ? 'selected' : ''}>🟠 Learning</option>
                <option value="G" ${currentStatus === 'G' ? 'selected' : ''}>🟢 Experienced</option>
            `;
            statusCell.appendChild(statusSelect);

            // 4. Evidence Cell
            const evidenceCell = row.insertCell();
            evidenceCell.className = 'competency-evidence-cell';
            const currentEvidenceText = compProgress.evidenceText || '';
            const currentEvidenceLink = compProgress.evidenceLink || '';

            const evidenceTextArea = document.createElement('textarea');
            evidenceTextArea.id = `evidence-text-${comp.id}`;
            evidenceTextArea.dataset.compId = comp.id;
            evidenceTextArea.className = 'evidence-textarea form-element';
            evidenceTextArea.placeholder = "Notes / Summary";
            evidenceTextArea.value = currentEvidenceText;
            evidenceTextArea.rows = 2; // Keep it small initially

            const evidenceLinkInput = document.createElement('input');
            evidenceLinkInput.type = 'url';
            evidenceLinkInput.id = `evidence-link-${comp.id}`;
            evidenceLinkInput.dataset.compId = comp.id;
            evidenceLinkInput.className = 'evidence-link-input form-element';
            evidenceLinkInput.placeholder = "Link your evidence (e.g. Google Drive)";
            evidenceLinkInput.value = currentEvidenceLink;

            evidenceCell.appendChild(evidenceTextArea);
            evidenceCell.appendChild(document.createElement('br')); // Simple separator for now
            evidenceCell.appendChild(evidenceLinkInput);

            // 5. "How do I?" Button Cell
            const actionCell = row.insertCell();
            actionCell.className = 'competency-action-cell';
            const guidanceButton = document.createElement('button');
            guidanceButton.className = 'guidance-button'; // Keep existing class
            guidanceButton.dataset.compId = comp.id;
            guidanceButton.textContent = 'How do I?';
            actionCell.appendChild(guidanceButton);
        });

        competenciesContainer.appendChild(table);
    });

    attachCompetencyEventListeners(); // This should still work as class names are preserved
}

    function displayChampions(champions) {
        championsContainer.innerHTML = '';
        if (!champions || champions.length === 0) {
            championsContainer.innerHTML = "<p>Champion information is not available.</p>";
            return;
        }
        champions.forEach(champ => {
            const card = document.createElement('div');
            card.className = 'champion-card'; // Use existing CSS
            card.innerHTML = `
                <h4>${champ.name}</h4>
                <p><strong>Role:</strong> ${champ.competencyRole || 'N/A'}</p>
                <p><a href="${champ.slackLink}" target="_blank" rel="noopener noreferrer">Message on Slack</a></p>
            `;
            championsContainer.appendChild(card);
        });
    }

    function showGuidance(competencyId) {
        let foundCompetency = null;
        if (allCompetenciesData.levels) {
            for (const level of allCompetenciesData.levels) {
                if (level.competencies) {
                    foundCompetency = level.competencies.find(c => c.id === competencyId);
                    if (foundCompetency) break;
                }
            }
        }

        if (foundCompetency) {
            guidanceTitle.textContent = `How Do I: ${foundCompetency.name}`;
            let contentHtml = ``;
            
            contentHtml += `<h3 class="modal-subheader">What does this mean?</h3>`;
        if (foundCompetency.whatThisMeansContent && foundCompetency.whatThisMeansContent.trim() !== '') {
            // Replace newline characters with <br> tags for HTML rendering
            // Or, you could apply `white-space: pre-line;` to a <p> tag via CSS instead.
            const whatMeanExplanation = foundCompetency.whatThisMeansContent.replace(/\n/g, '<br>');
            contentHtml += `<p class="modal-section-text">${whatMeanExplanation}</p>`;
        } else {
            contentHtml += `<p class="modal-section-text">Detailed explanation not yet available.</p>`;
        }

        contentHtml += `<h3 class="modal-subheader" style="margin-top: 20px;">How can I grow this skill?</h3>`; // Added margin for spacing
        if (foundCompetency.howTo && foundCompetency.howTo.length > 0) {
            contentHtml += `<ul class="modal-resource-list">`;
            foundCompetency.howTo.forEach(item => {
                let listItemContent = item;
                // Basic Markdown-like link detection: [text](url)
                const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/;
                const match = item.match(markdownLinkRegex);

                if (match && match[1] && match[2]) {
                    // If it's a full link, replace the whole item
                    if (item.trim() === match[0].trim()) {
                         listItemContent = `<a href="<span class="math-inline">\{match\[2\]\}" target\="\_blank" rel\="noopener noreferrer"\></span>{match[1]}</a>`;
                    } else {
                        // If the link is part of a larger string, replace just the link part
                        listItemContent = item.replace(match[0], `<a href="<span class="math-inline">\{match\[2\]\}" target\="\_blank" rel\="noopener noreferrer"\></span>{match[1]}</a>`);
                    }
                } else if (item.toLowerCase().startsWith('http://') || item.toLowerCase().startsWith('https://')) {
                    // If the item is just a raw URL, make it clickable
                    listItemContent = `<a href="<span class="math-inline">\{item\}" target\="\_blank" rel\="noopener noreferrer"\></span>{item}</a>`;
                }
                // Otherwise, it's just plain text

                contentHtml += `<li>${listItemContent}</li>`;
            });
            contentHtml += `</ul>`;
        } else {
            contentHtml += `<p class="modal-section-text">No specific resources listed for this competency.</p>`;
        }
        
        guidanceContent.innerHTML = contentHtml;
    } else {
        guidanceTitle.textContent = 'Guidance Not Found';
        guidanceContent.innerHTML = '<p>Sorry, guidance for this competency could not be loaded.</p>';
    }
    guidanceModal.style.display = 'block';
}

    // --- 4. EVENT LISTENERS ---
    function attachCompetencyEventListeners() {
        document.querySelectorAll('.guidance-button').forEach(button => {
            button.removeEventListener('click', handleGuidanceClick); // Prevent duplicate listeners
            button.addEventListener('click', handleGuidanceClick);
        });

        document.querySelectorAll('.status-select').forEach(select => {
            select.removeEventListener('change', handleStatusChange);
            select.addEventListener('change', handleStatusChange);
        });

        document.querySelectorAll('.evidence-textarea').forEach(textarea => {
            textarea.removeEventListener('blur', handleEvidenceTextChange);
            textarea.addEventListener('blur', handleEvidenceTextChange); // Save on blur
        });

        document.querySelectorAll('.evidence-link-input').forEach(input => {
            input.removeEventListener('blur', handleEvidenceLinkChange);
            input.addEventListener('blur', handleEvidenceLinkChange); // Save on blur
        });
    }
    // Define handlers separately to manage listener removal
    function handleGuidanceClick(event) { showGuidance(event.target.dataset.compId); }
    function handleStatusChange(event) { updateProgress(event.target.dataset.compId, 'status', event.target.value); }
    function handleEvidenceTextChange(event) { updateProgress(event.target.dataset.compId, 'evidenceText', event.target.value); }
    function handleEvidenceLinkChange(event) { updateProgress(event.target.dataset.compId, 'evidenceLink', event.target.value); }

    function updateProgress(compId, key, value) {
        if (!userProgress[compId]) userProgress[compId] = {};
        userProgress[compId][key] = value;
        saveUserProgress();
    }

    // Modal close logic
    if (closeModalButton) {
        closeModalButton.onclick = () => { guidanceModal.style.display = 'none'; }
    }
    window.onclick = (event) => { // Close if clicked outside modal content
        if (event.target == guidanceModal) {
            guidanceModal.style.display = 'none';
        }
    }

function escapeCSVField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    let stringField = String(field);
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        stringField = stringField.replace(/"/g, '""');
        stringField = `"${stringField}"`;
    }
    return stringField;
}

function exportCompetenciesToCSV() {
    const selectedLevelName = levelSelect.value; // Get the currently selected level from the dropdown
    let levelsToExport = [];
    let exportFilename = "ba_competencies_export.csv"; // Default filename

    if (selectedLevelName === "All") {
        levelsToExport = allCompetenciesData.levels; // Export all levels
        exportFilename = "ba_all_competencies_export.csv";
    } else {
        const selectedLevelObject = allCompetenciesData.levels.find(level => level.name === selectedLevelName);
        if (selectedLevelObject) {
            levelsToExport = [selectedLevelObject]; // Export only the selected level
            // Sanitize level name for filename
            const sanitizedLevelName = selectedLevelName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            exportFilename = `ba_${sanitizedLevelName}_competencies.csv`;
        } else {
            alert("Selected level not found. Cannot export.");
            return;
        }
    }

    if (!levelsToExport.length) {
        alert("No levels to export based on your selection.");
        return;
    }

    let csvDataRows = [];
    levelsToExport.forEach(level => {
        if (level.competencies && level.competencies.length > 0) {
            level.competencies.forEach(comp => {
                const progress = userProgress[comp.id] || {};
                const status = progress.status || 'Not Started';
                const evidenceText = progress.evidenceText || '';
                const evidenceLink = progress.evidenceLink || '';

                const rowData = [
                    escapeCSVField(level.name),
                    escapeCSVField(comp.id),
                    escapeCSVField(comp.name),
                    escapeCSVField(comp.description),
                    escapeCSVField(status),
                    escapeCSVField(evidenceText),
                    escapeCSVField(evidenceLink)
                ];
                csvDataRows.push(rowData.join(","));
            });
        }
    });

    if (csvDataRows.length === 0) {
        alert("No competencies found within the selected level(s) to export.");
        return;
    }

    const csvHeader = "Level,Competency ID,Competency Name,Description,Status,Evidence Notes,Evidence Link\n";
    const csvContent = csvHeader + csvDataRows.join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportFilename); // Use the dynamic filename
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert("CSV export is not supported in this browser.");
    }
}

// The event listener attachment in DOMContentLoaded remains the same,
// as the button ID ('export-csv-button') is unchanged.
// Make sure this part is still in your DOMContentLoaded listener:
//
// const exportCsvButton = document.getElementById('export-csv-button');
// if (exportCsvButton) {
//     exportCsvButton.addEventListener('click', exportCompetenciesToCSV);
// }

    // --- INITIALIZE ---
    loadData();
});