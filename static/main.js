// This file contains the page functionality and API interaction

// When the page loads, run this code
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the engine page (form page)
    const fitnessForm = document.getElementById('fitnessForm');
    if (fitnessForm) {
        // When user submits the form
        fitnessForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Stop the form from submitting normally

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Analyzing...";
            submitBtn.disabled = true;

            try {
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());

                // Call the Netlify Function API
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error('Analysis failed');
                }

                const result = await response.json();

                // Save results and redirect
                localStorage.setItem('fitNationResult', JSON.stringify(result));
                window.location.href = 'results.html';
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during analysis. Please try again.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Check if we're on the results page
    const resultsPage = document.querySelector('.results-dashboard');
    if (resultsPage) {
        // Get the saved results from storage
        const rawResult = localStorage.getItem('fitNationResult');
        if (!rawResult) {
            // If no results, go back to engine page
            window.location.href = 'engine.html';
            return;
        }

        const result = JSON.parse(rawResult);

        // Fill in the risk level badge
        const riskBadge = document.getElementById('riskLevelBadge');
        const riskText = document.getElementById('riskLevelText');
        if (riskBadge && riskText) {
            riskBadge.setAttribute('data-level', result.risk_level);
            riskText.textContent = result.risk_level;
        }

        // Fill in the on-track badge
        const onTrackBadge = document.getElementById('onTrackBadge');
        if (onTrackBadge) {
            onTrackBadge.textContent = result.risk_level === 'Low' ? 'On Track' : (result.risk_level === 'High' ? 'High Risk' : 'Needs Focus');
            onTrackBadge.className = 'badge ' + (result.risk_level === 'Low' ? 'badge-green' : (result.risk_level === 'High' ? 'badge-red' : 'badge-amber'));
        }

        // Fill in BMI and goal information
        const bmiVal = document.getElementById('bmiValue');
        const bmiCat = document.getElementById('bmiCategoryLabel');
        const goalTxt = document.getElementById('goalText');
        const bntTitle = document.getElementById('bottleneckTitle');
        const bntMsg = document.getElementById('bottleneckMsg');

        if (bmiVal) bmiVal.textContent = result.reality_check.bmi;
        if (bmiCat) bmiCat.textContent = `BMI (${result.reality_check.bmi_category})`;
        if (goalTxt) goalTxt.textContent = result.user_input.goal;
        if (bntTitle) bntTitle.textContent = result.reality_check.primary_bottleneck;
        if (bntMsg) bntMsg.textContent = result.reality_check.bottleneck_msg;

        // Fill in time and consistency circles
        const timeCircle = document.getElementById('timeCircle');
        const timeText = document.getElementById('timeText');
        if (timeCircle && timeText) {
            const val = Math.round((result.user_input.time / 90) * 100);
            timeCircle.style.setProperty('--val', val);
            timeText.textContent = `${result.user_input.time}m`;
        }

        const consCircle = document.getElementById('consistencyCircle');
        const consText = document.getElementById('consistencyText');
        if (consCircle && consText) {
            const val = result.user_input.consistency === 'Mostly consistent' ? 100 : 35;
            consCircle.style.setProperty('--val', val);
            consText.textContent = result.user_input.consistency === 'Mostly consistent' ? 'High' : 'Low';
        }

        // Fill in nutrition information
        const dietType = document.getElementById('dietTypeText');
        const nutrList = document.getElementById('nutritionList');
        const nutrAlert = document.getElementById('nutritionAlertMsg');

        if (dietType) dietType.textContent = `${result.user_input.food_type} Focus`;
        if (nutrList) {
            result.reality_check.lifestyle_warnings.forEach(point => {
                const item = document.createElement('div');
                item.className = 'nutrient-item' + (point.includes('Protein') ? ' highlight' : '');
                item.innerHTML = `
                    <span class="nutrient-icon">${point.includes('Protein') ? '⚡' : '💡'}</span>
                    <div class="nutrient-text">
                        ${point.includes('Protein') ? '<strong>Protein Priority</strong>' : ''}
                        <p>${point}</p>
                    </div>
                `;
                nutrList.appendChild(item);
            });
        }
        if (nutrAlert) {
            nutrAlert.textContent = result.user_input.goal === 'Maintain'
                ? 'Adequate protein intake helps preserve muscle mass during maintenance.'
                : 'Muscle hypertrophy requires precise planning with this diet.';
        }

        // Fill in fitness paths
        const pathsPanel = document.getElementById('pathsPanel');
        if (pathsPanel) {
            result.paths.forEach(path => {
                const row = document.createElement('div');
                row.className = `path-row ${path.status === 'Blocked' ? 'blocked' : ''}`;

                let badgeClass = 'badge-green';
                if (path.status === 'Blocked') badgeClass = 'badge-red';
                else if (path.status === 'Conditional') badgeClass = 'badge-amber';
                else if (path.status === 'Recommended') badgeClass = 'badge-green';

                row.innerHTML = `
                    <div class="path-name-group">
                        <p class="path-name">${path.name}</p>
                        ${path.confidence > 0 ? `
                            <div class="confidence-container">
                                <div class="confidence-bar" style="width: ${path.confidence}%"></div>
                                <span class="confidence-text">${path.confidence}% Match</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="path-badge-group">
                        <span class="badge ${badgeClass}">${path.status.toUpperCase()}</span>
                    </div>
                    <div class="path-reason-group">
                        <p class="path-reason">${path.reason}</p>
                    </div>
                `;
                pathsPanel.appendChild(row);
            });
        }

        // Fill in avoid list
        const avoidGrid = document.getElementById('avoidGrid');
        if (avoidGrid) {
            result.not_to_do.forEach(item => {
                const card = document.createElement('div');
                card.className = 'avoid-card-item';
                card.innerHTML = `
                    <div class="avoid-header">
                        <span class="avoid-icon">✕</span>
                        <span class="avoid-title">${item.item}</span>
                    </div>
                    <p class="avoid-reason">${item.reason}</p>
                `;
                avoidGrid.appendChild(card);
            });
        }

        // Fill in decision trace
        const traceContent = document.getElementById('traceContent');
        if (traceContent) {
            result.trace.forEach(t => {
                const item = document.createElement('div');
                item.className = 'trace-item';
                item.innerHTML = `
                    <div class="trace-left">
                        <span style="font-weight: 700">${t.step}</span>
                        <span style="color: var(--text-secondary); margin-left: 1rem">${t.detail}</span>
                    </div>
                    <span class="trace-status ${t.status.toLowerCase()}">${t.status}</span>
                `;
                traceContent.appendChild(item);
            });
        }

        // Fill in myths section
        const mythsGrid = document.getElementById('mythsGrid');
        if (mythsGrid) {
            result.myths.forEach(m => {
                const item = document.createElement('div');
                item.className = 'myth-item';
                item.innerHTML = `
                    <div class="myth-header">
                        <span class="myth-status">MYTH</span>
                        <p class="myth-text">${m.myth}</p>
                    </div>
                    <div class="myth-body">
                        <span class="reality-status">REALITY</span>
                        <p class="reality-text">${m.reality}</p>
                    </div>
                    <div class="myth-footer">
                        <span class="avoid-label">AVOID:</span>
                        <span class="avoid-text">${m.avoid}</span>
                    </div>
                `;
                mythsGrid.appendChild(item);
            });
        }

        // Fill in routine and lifestyle warnings
        const routineTxt = document.getElementById('routineText');
        const lifestyleWarns = document.getElementById('lifestyleWarnings');
        if (routineTxt) routineTxt.textContent = result.routine;
        if (lifestyleWarns) {
            result.reality_check.lifestyle_warnings.forEach(warning => {
                if (!warning.includes('Protein')) {
                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border)';
                    badge.innerHTML = `⚠️ ${warning}`;
                    lifestyleWarns.appendChild(badge);
                }
            });
        }
    }
});
