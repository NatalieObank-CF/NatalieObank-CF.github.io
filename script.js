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
            // In script.js, replace the content of your displayCompetencies function

function displayCompetencies() {
    // Get the two main display areas
    const coreCompetenciesArea = document.getElementById('core-competencies-area');
    const baCompetenciesArea = document.getElementById('ba-competencies-area');
    const levelSelect = document.getElementById('level-select');
    const mainCompetenciesSection = document.getElementById('competencies-section'); // Get the parent section

    // Ensure all necessary elements and global data exist
    if (!coreCompetenciesArea || !baCompetenciesArea || !levelSelect || !mainCompetenciesSection || !allCompetenciesData || !allCompetenciesData.levels) {
        console.error("Required elements for displaying competencies not found or data not fully loaded.");
        // Optionally display an error message in the main section
        if(mainCompetenciesSection) {
             mainCompetenciesSection.innerHTML = "<p class='error-message'>Error setting up competency display areas.</p>";
        }
        return;
    }

    // Clear previous content from both areas
    coreCompetenciesArea.innerHTML = '<h3>Core Competencies</h3>'; // Keep the heading
    baCompetenciesArea.innerHTML = '<h3>Business Analysis Competencies</h3>'; // Keep the heading


    const selectedLevelName = levelSelect.value;

    const levelsToDisplay = [];
    if (selectedLevelName === "All") {
        levelsToDisplay.push(...allCompetenciesData.levels);
    } else {
        const selectedLevelData = allCompetenciesData.levels.find(l => l.name === selectedLevelName);
        if (selectedLevelData) {
            levelsToDisplay.push(selectedLevelData);
            // If "Mid-Level BA" is selected, also find and add "Senior BA" if it exists
            if (selectedLevelName === "Mid-Level BA") {
                const seniorLevelData = allCompetenciesData.levels.find(l => l.name === "Senior BA");
                if (seniorLevelData) {
                    levelsToDisplay.push(seniorLevelData);
                }
            }
        }
    }

    if (levelsToDisplay.length === 0) {
        coreCompetenciesArea.innerHTML += "<p>No competency frameworks found for this level selection.</p>";
        baCompetenciesArea.innerHTML += "<p></p>"; // Keep structure consistent
        return;
    }

    // Iterate through each relevant level (e.g., Associate, or Mid + Senior)
    levelsToDisplay.forEach(level => {
        // Optionally add the level title again within each area if showing multiple levels at once
        // const levelTitleCore = document.createElement('h4'); levelTitleCore.textContent = level.name; coreCompetenciesArea.appendChild(levelTitleCore);
        // const levelTitleBA = document.createElement('h4'); levelTitleBA.textContent = level.name; baCompetenciesArea.appendChild(levelTitleBA);

        if (!level.groups || level.groups.length === 0) {
             console.warn(`No competency groups defined for level: ${level.name}`);
             return; // Skip if level has no top-level groups
        }

        // Loop through each Top-Level Group (e.g., Core Competencies, Business Analysis Competencies)
        level.groups.forEach(topGroup => {
            let targetArea = null; // Determine which area to append to

            // --- Assign the target container based on Top-Level Group Name ---
            if (topGroup.groupName === "Core Competencies") {
                targetArea = coreCompetenciesArea;
            } else if (topGroup.groupName === "Business Analysis Competencies") {
                targetArea = baCompetenciesArea;
            } else {
                 console.warn(`Unknown top-level group name: "<span class="math-inline">\{topGroup\.groupName\}" in level "</span>{level.name}". Skipping.`);
                return; // Skip if the top group name isn't recognized
            }
             // --- End Assign Target Area ---

            // Optionally add the level title here, before the group's content, if you want it per level within the area
            // This is useful if "All Levels" is selected.
             const levelTitleForGroup = document.createElement('h4'); // Use h4 or h5
             levelTitleForGroup.className = 'level-title-for-group';
             levelTitleForGroup.textContent = `${level.name} Level`; // e.g., "Associate BA Level"
             targetArea.appendChild(levelTitleForGroup);


            if (!topGroup.subGroups || topGroup.subGroups.length === 0) {
                const noSubGroupsMessage = document.createElement('p');
                noSubGroupsMessage.textContent = `No sub-groups defined for "${topGroup.groupName}" under ${level.name}.`;
                targetArea.appendChild(noSubGroupsMessage);
            } else {
                 // Loop through each Second-Level Group (e.g., Interactions, Integrity)
                 topGroup.subGroups.forEach(subGroup => {
                     const subGroupContainer = document.createElement('div');
                     subGroupContainer.className = 'sub-competency-group-container'; // Use container for styling

                     const subGroupHeader = document.createElement('h4'); // Heading for the Second-Level Group
                     subGroupHeader.className = 'sub-competency-group-header';
                     subGroupHeader.textContent = subGroup.subGroupName; // Displays "Interactions", "Integrity" etc.
                     subGroupContainer.appendChild(subGroupHeader);


                     if (!subGroup.competencies || subGroup.competencies.length === 0) {
                         const noCompMessage = document.createElement('p');
                         noCompMessage.textContent = `No competencies listed in the "${subGroup.subGroupName}" sub-group under ${level.name}.`;
                         subGroupContainer.appendChild(noCompMessage);
                     } else {
                         // Create a table for the competencies within this Second-Level Group
                         const table = document.createElement('table');
                         table.className = 'competency-table';
                          // Table headers (assuming consistent)
                         table.innerHTML = `
                             <thead>
                                 <tr>
                                     <th class="competency-name-header">Name</th>
                                     <th class="competency-desc-header">Description</th>
                                     <th class="competency-status-header">Status</th>
                                     <th class="competency-evidence-header">Evidence/Notes</th>
                                     <th class="competency-action-header">How do I?</th>
                                 </tr>
                             </thead>
                             <tbody></tbody>
                         `;
                         const tbody = table.querySelector('tbody');

                         // Loop through each individual competency
                         subGroup.competencies.forEach(comp => {
                             const row = tbody.insertRow();
                             // Use the global userProgress object
                             const progress = userProgress[comp.id] || {};

                             // --- Competency Row Cells (same logic as before) ---
                             // (Code for Name, Description, Status, Evidence, Action cells goes here)
                             // You can copy this from your previous displayCompetencies function
                              // Name Cell
                              const nameCell = row.insertCell();
                              nameCell.className = 'competency-name-cell';
                              nameCell.textContent = comp.name;

                              // Description Cell
                              const descCell = row.insertCell();
                              descCell.className = 'competency-desc-cell';
                              let descriptionText = comp.description || comp.whatThisMeansContent || 'No description available.';
                              descCell.innerHTML = descriptionText.replace(/\n/g, '<br>'); // Handle newlines

                              // Status Cell
                              const statusCell = row.insertCell();
                              statusCell.className = 'competency-status-cell';
                              const statusSelect = document.createElement('select');
                              statusSelect.className = 'status-select';
                              statusSelect.dataset.competencyId = comp.id;
                              ['Not Started', 'Awareness', 'Working Towards', 'Proficient', 'Expert'].forEach(s => {
                                  const option = document.createElement('option');
                                  option.value = s;
                                  option.textContent = s;
                                  if (progress.status === s) option.selected = true;
                                  statusSelect.appendChild(option);
                              });
                              statusSelect.value = progress.status || 'Not Started';
                              statusSelect.style.backgroundColor = getStatusColor(progress.status || 'Not Started');
                              statusCell.appendChild(statusSelect);

                              // Evidence Cell
                              const evidenceCell = row.insertCell();
                              evidenceCell.className = 'competency-evidence-cell';
                              const evidenceTextarea = document.createElement('textarea');
                              evidenceTextarea.className = 'evidence-textarea form-element';
                              evidenceTextarea.dataset.competencyId = comp.id;
                              evidenceTextarea.placeholder = 'Your notes, achievements, examples...';
                              evidenceTextarea.value = progress.evidenceText || '';

                              const evidenceLinkInput = document.createElement('input');
                              evidenceLinkInput.type = 'url';
                              evidenceLinkInput.className = 'evidence-link-input form-element';
                              evidenceLinkInput.dataset.competencyId = comp.id;
                              evidenceLinkInput.placeholder = 'Link to evidence (e.g., document, SharePoint)';
                              evidenceLinkInput.value = progress.evidenceLink || '';

                              evidenceCell.appendChild(evidenceTextarea);
                              evidenceCell.appendChild(document.createElement('br'));
                              evidenceCell.appendChild(evidenceLinkInput);

                              // Action Cell ("How do I?")
                              const actionCell = row.insertCell();
                              actionCell.className = 'competency-action-cell';
                              if ((comp.howTo && comp.howTo.length > 0) || comp.whatThisMeansContent) {
                                  const guidanceButton = document.createElement('button');
                                  guidanceButton.textContent = 'How do I?';
                                  guidanceButton.className = 'guidance-button';
                                  guidanceButton.dataset.competencyId = comp.id;
                                  actionCell.appendChild(guidanceButton);
                              }

                              // --- End of Competency Row Cells ---
                         });
                         subGroupContainer.appendChild(table); // Append the table to the subgroup container
                     }
                     targetArea.appendChild(subGroupContainer); // Append the subgroup container to the correct area (Core or BA)
                 });
             }
        });
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
