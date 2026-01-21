// Fitness Logic Implementation
const FitnessLogic = {
    calculateBmi: (weightKg, heightCm) => {
        const heightM = heightCm / 100;
        return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    },

    getBmiCategory: (bmi) => {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal weight";
        if (bmi < 30) return "Overweight";
        return "Obese";
    },

    analyzeLifestyle: (sleepHours, activityLevel, consistency, foodType) => {
        const points = [];
        let bottleneck = "Lifestyle";
        let limitation = "lifestyle";

        const proteinMsgs = {
            Veg: "Protein Planning: Vegetarian sources require very careful planning to hit targets.",
            Egg: "Protein Flexibility: Eggs provide high-quality protein and moderate flexibility.",
            "Non-veg": "Protein Accessibility: Non-veg diet allows for easy protein target achievement."
        };
        points.push(proteinMsgs[foodType] || proteinMsgs.Veg);

        if (sleepHours < 6) {
            bottleneck = "Sleep Debt";
            limitation = "sleep";
            points.push("Severe sleep deprivation detected. Recovery is currently impossible.");
        } else if (consistency === "Quit frequently") {
            bottleneck = "Lack of Consistency";
            limitation = "consistency";
            points.push("Past patterns show frequent quitting; sustainability is now the only priority.");
        } else if (activityLevel === "Low") {
            bottleneck = "Sedentary Lifestyle";
            limitation = "lifestyle";
            points.push("Highly sedentary lifestyle detected. Movement is more important than 'intensity' right now.");
        }

        return {
            lifestyle_points: points,
            primary_bottleneck: bottleneck,
            limitation_msg: `Your biggest limitation right now is ${limitation}, not workout.`
        };
    },

    getPaths: (consistency, sleep, activity, goal) => {
        const isHighRisk = sleep < 6 || consistency === "Quit frequently";
        const paths = [
            {
                name: "Gym Training",
                status: isHighRisk ? "Blocked" : "Conditional",
                confidence: isHighRisk ? 0 : 60,
                reason: sleep < 6 ? "Severe sleep debt makes gym-level intensity a high injury risk." :
                    consistency === "Quit frequently" ? "History of frequent quitting suggests you shouldn't commit to a gym membership yet." :
                        "Structured environment for progressive overload.",
                fail_condition: "Will fail if you focus on ego-lifting instead of form."
            },
            {
                name: "HIIT (High Intensity)",
                status: isHighRisk ? "Blocked" : "Conditional",
                confidence: isHighRisk ? 0 : 50,
                reason: sleep < 6 ? "CNS fatigue from low sleep makes high-intensity cardio dangerous." :
                    consistency === "Quit frequently" ? "HIIT is mentally taxing; you need to build the baseline habit first." :
                        "Efficient but recovery-dependent; monitor CNS fatigue.",
                fail_condition: "Will fail if CNS fatigue is ignored (stop if feeling dizzy)."
            },
            {
                name: "Home Workouts",
                status: (activity === "Low" && consistency === "Quit frequently") ? "Blocked" : "Allowed",
                confidence: (activity === "Low" && consistency === "Quit frequently") ? 0 : 70,
                reason: (activity === "Low" && consistency === "Quit frequently") ? "Even basic bodyweight circuits might be too much; start with movement." :
                    "Low barrier to entry. Great for building body control.",
                fail_condition: "Will fail if you don't keep track of your sets and reps."
            },
            {
                name: "Walking & Mobility",
                status: "Recommended",
                confidence: 85,
                reason: "The foundation of long-term health and injury prevention.",
                fail_condition: "Will fail if you don't hit 8,000 steps daily."
            }
        ];

        if (goal === "Muscle gain" && consistency === "Quit frequently") {
            const gym = paths.find(p => p.name === "Gym Training");
            gym.status = "Blocked";
            gym.reason = "Muscle gain requires MONTHS of consistency. You must fix your 'quitting' pattern first.";
        }
        return paths;
    },

    getWarnings: (sleep, consistency, bmi, goal, timeAvailable) => {
        const warnings = [
            { item: "Extreme Calorie Cuts", reason: "Destroys metabolism and leads to severe metabolic adaptation.", priority: 1 },
            { item: "Buying Expensive Supplements", reason: "Waste of money if core sleep and consistency are broken.", priority: 1 },
            { item: "Comparing Progress to Social Media", reason: "Most influencers use lighting, pumps, or PEDs to look like that.", priority: 1 },
            { item: "Ego Lifting at the Gym", reason: "Lifting heavier than form allows leads to injury, not growth.", priority: 1 }
        ];

        if (sleep < 6) warnings.push({ item: "Late Night Intense Training", reason: "Recovery is already compromised; midnight workouts will crash your CNS.", priority: 10 });
        if (consistency === "Quit frequently") warnings.push({ item: "Complex 6-Day Exercise Splits", reason: "You need habit building, not complexity. Start with a 3-day baseline.", priority: 10 });
        if (bmi > 30) warnings.push({ item: "High-Impact Running", reason: "At this weight, high-impact cardio like running puts 5x bodyweight stress on knees.", priority: 10 });
        if (goal === "Fat loss") warnings.push({ item: "Liquid-Only Diets", reason: "Unsustainable and leads to muscle loss; your brain needs solid food density.", priority: 8 });
        if (goal === "Muscle gain") warnings.push({ item: "Ignoring Compound Lifts", reason: "You can't grow muscle efficiently by only doing isolation (bicep curls).", priority: 8 });
        if (timeAvailable === 90 && sleep < 6) warnings.push({ item: "90-Minute Marathon Sessions", reason: "High-volume training with low sleep is a recipe for chronic inflammation.", priority: 9 });

        return warnings.sort((a, b) => b.priority - a.priority).filter((v, i, a) => a.findIndex(t => (t.item === v.item)) === i).slice(0, 4);
    },

    getRoutine: (time, sleep, consistency, activity, goal, bmi) => {
        const isHighRisk = sleep < 6 || consistency === "Quit frequently";
        const isAthlete = activity === "High" && consistency === "Mostly consistent";
        const isSedentary = activity === "Low";
        const isObese = bmi >= 30;

        if (time === 30) {
            if (isHighRisk) return "10 min Light Stretching + 20 min Easy Walking (Focus: Building the Habit First)";
            if (isSedentary) return "5 min Warmup + 20 min Bodyweight Basics (Squats, Push-ups) + 5 min Walking";
            if (isAthlete && goal === "Muscle gain") return "5 min Dynamic Warmup + 20 min Compound Lifts (Heavy Focus) + 5 min Stretch";
            if (goal === "Fat loss") return "5 min Warmup + 20 min Circuit Training (Strength + Cardio Mix) + 5 min Cooldown";
            return "10 min Mobility Work + 15 min Strength Training + 5 min Core Work";
        }

        if (time === 60) {
            if (isHighRisk) return "10 min Gentle Mobility + 35 min Low-Impact Movement (Walking/Cycling) + 15 min Stretching";
            if (isSedentary && consistency === "Quit frequently") return "10 min Warmup + 30 min Basic Strength (Full Body) + 10 min Walking + 10 min Stretch";
            if (isObese) return "10 min Warmup + 30 min Low-Impact Strength Training + 15 min Walking + 5 min Cooldown";
            if (isAthlete && goal === "Muscle gain") return "10 min Dynamic Prep + 40 min Heavy Compound Lifts + 10 min Accessory Work";
            if (isAthlete && goal === "Fat loss") return "10 min Warmup + 30 min Strength Training + 15 min HIIT Cardio + 5 min Cooldown";
            if (goal === "Muscle gain") return "10 min Warmup + 40 min Progressive Strength Training + 10 min Isolation Work";
            if (goal === "Fat loss") return "10 min Warmup + 25 min Strength Training + 20 min Moderate Cardio + 5 min Stretch";
            return "10 min Warmup + 35 min Balanced Training (Strength + Cardio) + 15 min Mobility";
        }

        // 90 mins
        if (isHighRisk) return "15 min Mobility + 45 min Moderate Training + 30 min Active Recovery (Prevent Overtraining)";
        if (isSedentary && consistency === "Quit frequently") return "15 min Warmup + 45 min Full Body Strength + 20 min Walking + 10 min Stretch (Build Foundation)";
        if (isAthlete && goal === "Muscle gain" && sleep >= 7) return "15 min Dynamic Prep + 60 min Intense Strength Training + 15 min Skill/Accessory Work";
        if (isAthlete && goal === "Fat loss") return "15 min Warmup + 45 min Strength Training + 20 min Cardio Intervals + 10 min Cooldown";
        if (goal === "Muscle gain" && consistency === "Mostly consistent") return "15 min Warmup + 55 min Progressive Overload Training + 20 min Hypertrophy Focus";
        if (goal === "Fat loss") return "15 min Warmup + 40 min Strength Training + 25 min Cardio + 10 min Core & Stretch";
        if (sleep >= 6 && consistency === "Mostly consistent") return "15 min Dynamic Prep + 50 min Balanced Training + 15 min Skill Work + 10 min Recovery";
        return "15 min Warmup + 50 min Moderate Training + 25 min Active Recovery (Sustainability Focus)";
    },

    getMyths: (goal) => {
        const allMyths = {
            "Fat loss": [
                { myth: "Spot reduction (reducing fat in one area)", reality: "Fat loss happens globally across the body, not where you work out.", avoid: "Those doing 1000 situps to lose belly fat." },
                { myth: "More sweat = more fat loss", reality: "Sweat is for cooling your body, not melting fat.", avoid: "People wearing winter hoodies in the gym." },
                { myth: "Cardio is the only way to lose fat", reality: "Strength training builds muscle which increases your resting metabolic rate.", avoid: "Ignoring resistance training completely." }
            ],
            "Muscle gain": [
                { myth: "You need to eat constantly to gain muscle", reality: "Muscle growth requires a moderate calorie surplus and adequate protein, not endless eating.", avoid: "Dirty bulking that leads to excessive fat gain." },
                { myth: "More protein always equals more muscle", reality: "Beyond 1.6-2.2g per kg bodyweight, extra protein doesn't build more muscle.", avoid: "Wasting money on excessive protein supplements." },
                { myth: "You must lift heavy every single day", reality: "Muscle grows during recovery, not during the workout. Rest days are essential.", avoid: "Overtraining and ignoring recovery signals." }
            ],
            Maintain: [
                { myth: "Maintenance means doing nothing", reality: "Maintaining fitness requires consistent effort, just not progressive overload.", avoid: "Completely stopping your routine." },
                { myth: "You can eat whatever you want if you exercise", reality: "Nutrition quality still matters for health, energy, and body composition.", avoid: "Using exercise as an excuse for poor diet choices." },
                { myth: "Maintenance is boring and pointless", reality: "Maintenance is a skill that prevents yo-yo dieting and builds long-term habits.", avoid: "Constantly chasing extreme transformations." }
            ]
        };
        return allMyths[goal] || allMyths.Maintain;
    },

    analyzeUser: (data) => {
        const age = parseInt(data.age || 25);
        const height = parseFloat(data.height || 170);
        const weight = parseFloat(data.weight || 70);
        const sleep = parseFloat(data.sleep || 7);
        const activity = data.activity || 'Medium';
        const time = parseInt(data.time || 60);
        const food = data.food || 'Veg';
        const goal = data.goal || 'Maintain';
        const consistency = data.consistency || 'Quit frequently';

        const bmi = FitnessLogic.calculateBmi(weight, height);
        const lifestyle = FitnessLogic.analyzeLifestyle(sleep, activity, consistency, food);

        return {
            user_input: { goal, food, time, consistency },
            risk_level: (sleep < 6 || consistency === "Quit frequently") ? "High" : (activity === "High" && consistency === "Mostly consistent" ? "Low" : "Medium"),
            reality_check: {
                bmi,
                bmi_category: FitnessLogic.getBmiCategory(bmi),
                primary_bottleneck: lifestyle.primary_bottleneck,
                bottleneck_msg: lifestyle.limitation_msg,
                lifestyle_warnings: lifestyle.lifestyle_points
            },
            paths: FitnessLogic.getPaths(consistency, sleep, activity, goal),
            not_to_do: FitnessLogic.getWarnings(sleep, consistency, bmi, goal, time),
            routine: FitnessLogic.getRoutine(time, sleep, consistency, activity, goal, bmi),
            trace: [
                { step: "Sleep Check", status: sleep >= 6 ? "Passed" : "Failed", detail: `User reported ${sleep}h sleep.` },
                { step: "Consistency Check", status: consistency === "Mostly consistent" ? "Passed" : "Failed", detail: `User pattern: ${consistency}.` },
                { step: "Time Alignment", status: "Passed", detail: `${time} min window confirmed.` },
                { step: "Goal Alignment", status: "Passed", detail: `Optimizing for ${goal}.` }
            ],
            myths: FitnessLogic.getMyths(goal)
        };
    }
};

const UI = {
    setText: (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    renderList: (id, items, renderer) => {
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => container.appendChild(renderer(item)));
    },

    renderResults: (result) => {
        const riskBadge = document.getElementById('riskLevelBadge');
        if (riskBadge) {
            riskBadge.setAttribute('data-level', result.risk_level);
            UI.setText('riskLevelText', result.risk_level);
        }

        const onTrack = document.getElementById('onTrackBadge');
        if (onTrack) {
            onTrack.textContent = result.risk_level === 'Low' ? 'On Track' : (result.risk_level === 'High' ? 'High Risk' : 'Needs Focus');
            onTrack.className = 'badge ' + (result.risk_level === 'Low' ? 'badge-green' : (result.risk_level === 'High' ? 'badge-red' : 'badge-amber'));
        }

        UI.setText('bmiValue', result.reality_check.bmi);
        UI.setText('bmiCategoryLabel', `BMI (${result.reality_check.bmi_category})`);
        UI.setText('goalText', result.user_input.goal);
        UI.setText('bottleneckTitle', result.reality_check.primary_bottleneck);
        UI.setText('bottleneckMsg', result.reality_check.bottleneck_msg);
        UI.setText('dietTypeText', `${result.user_input.food} Focus`);
        UI.setText('routineText', result.routine);
        UI.setText('nutritionAlertMsg', result.user_input.goal === 'Maintain' ? 'Adequate protein intake helps preserve muscle mass during maintenance.' : 'Muscle hypertrophy requires precise planning with this diet.');

        const timeProgress = Math.round((result.user_input.time / 90) * 100);
        document.getElementById('timeCircle')?.style.setProperty('--val', timeProgress);
        UI.setText('timeText', `${result.user_input.time}m`);

        const consProgress = result.user_input.consistency === 'Mostly consistent' ? 100 : 35;
        document.getElementById('consistencyCircle')?.style.setProperty('--val', consProgress);
        UI.setText('consistencyText', result.user_input.consistency === 'Mostly consistent' ? 'High' : 'Low');

        UI.renderList('nutritionList', result.reality_check.lifestyle_warnings, point => {
            const item = document.createElement('div');
            const isProtein = point.includes('Protein');
            item.className = `nutrient-item ${isProtein ? 'highlight' : ''}`;
            item.innerHTML = `
                <span class="nutrient-icon">${isProtein ? '⚡' : '💡'}</span>
                <div class="nutrient-text">
                    ${isProtein ? '<strong>Protein Priority</strong>' : ''}
                    <p>${point}</p>
                </div>`;
            return item;
        });

        UI.renderList('pathsPanel', result.paths, path => {
            const row = document.createElement('div');
            row.className = `path-row ${path.status === 'Blocked' ? 'blocked' : ''}`;
            const badgeClass = path.status === 'Blocked' ? 'badge-red' : (path.status === 'Conditional' ? 'badge-amber' : 'badge-green');
            row.innerHTML = `
                <div class="path-name-group">
                    <p class="path-name">${path.name}</p>
                    ${path.confidence > 0 ? `<div class="confidence-container"><div class="confidence-bar" style="width: ${path.confidence}%"></div><span class="confidence-text">${path.confidence}% Match</span></div>` : ''}
                </div>
                <div class="path-badge-group"><span class="badge ${badgeClass}">${path.status.toUpperCase()}</span></div>
                <div class="path-reason-group"><p class="path-reason">${path.reason}</p></div>`;
            return row;
        });

        UI.renderList('avoidGrid', result.not_to_do, item => {
            const card = document.createElement('div');
            card.className = 'avoid-card-item';
            card.innerHTML = `<div class="avoid-header"><span class="avoid-icon">✕</span><span class="avoid-title">${item.item}</span></div><p class="avoid-reason">${item.reason}</p>`;
            return card;
        });

        UI.renderList('traceContent', result.trace, t => {
            const item = document.createElement('div');
            item.className = 'trace-item';
            item.innerHTML = `<div class="trace-left"><strong>${t.step}</strong> <span style="color: var(--text-secondary); margin-left:1rem">${t.detail}</span></div><span class="trace-status ${t.status.toLowerCase()}">${t.status}</span>`;
            return item;
        });

        UI.renderList('mythsGrid', result.myths, m => {
            const item = document.createElement('div');
            item.className = 'myth-item';
            item.innerHTML = `
                <div class="myth-header"><span class="myth-status">MYTH</span><p class="myth-text">${m.myth}</p></div>
                <div class="myth-body"><span class="reality-status">REALITY</span><p class="reality-text">${m.reality}</p></div>
                <div class="myth-footer"><span class="avoid-label">AVOID:</span><span class="avoid-text">${m.avoid}</span></div>`;
            return item;
        });

        const lifestyleWarns = document.getElementById('lifestyleWarnings');
        if (lifestyleWarns) {
            lifestyleWarns.innerHTML = '';
            result.reality_check.lifestyle_warnings.filter(w => !w.includes('Protein')).forEach(warning => {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border)';
                badge.innerHTML = `⚠️ ${warning}`;
                lifestyleWarns.appendChild(badge);
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const fitnessForm = document.getElementById('fitnessForm');
    if (fitnessForm) {
        fitnessForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Analyzing...";
            submitBtn.disabled = true;

            const result = FitnessLogic.analyzeUser(Object.fromEntries(new FormData(this).entries()));
            localStorage.setItem('fitNationResult', JSON.stringify(result));
            setTimeout(() => window.location.href = 'results.html', 800);
        });
    }

    if (document.querySelector('.results-dashboard')) {
        const rawResult = localStorage.getItem('fitNationResult');
        if (!rawResult) return window.location.href = 'engine.html';

        const result = JSON.parse(rawResult);
        if (result.error) {
            const content = document.querySelector('.dashboard-content');
            if (content) content.innerHTML = `<div class="glass-card" style="grid-column: span 12; padding: 3rem; text-align: center;"><h2 style="color: var(--danger-accent)">Error Loading Results</h2><p>${result.error}</p><a href="engine.html" class="btn-generate" style="display:inline-block; margin-top:2rem">Try Again</a></div>`;
            return;
        }
        UI.renderResults(result);
    }
});
